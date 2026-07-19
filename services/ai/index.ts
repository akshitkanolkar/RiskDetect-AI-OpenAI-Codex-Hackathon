import OpenAI from "openai";
import { z } from "zod";
import { logError, logInfo } from "@/lib/api/response";
import {
  SYSTEM_SECURITY_ANALYST,
  buildCopilotPrompt,
  buildImageAnalysisPrompt,
  buildUrlAnalysisPrompt,
} from "@/services/ai/prompts";
import type { Recommendation } from "@/types/scans";
import type { RiskLevel } from "@/types";
import { scoreToRiskLevel } from "@/utils/risk";

const analysisSchema = z.object({
  risk_score: z.number().min(0).max(100),
  risk_level: z.enum(["safe", "low", "medium", "high", "critical"]),
  confidence: z.number().min(0).max(100),
  threat_category: z.string().optional(),
  ai_explanation: z.string(),
  recommendations: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        priority: z.enum(["immediate", "soon", "optional"]),
      }),
    )
    .default([]),
});

function getClient() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      logError("ai", `Attempt ${attempt + 1} failed`, {
        error: error instanceof Error ? error.message : String(error),
      });
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

async function completeJson(prompt: string) {
  const client = getClient();
  if (!client) return null;

  const completion = await withRetry(() =>
    client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_SECURITY_ANALYST },
        { role: "user", content: prompt },
      ],
    }),
  );

  const content = completion.choices[0]?.message?.content;
  if (!content) return null;
  return JSON.parse(content);
}

function fallbackUrlAnalysis(input: {
  heuristicScore: number;
  reasons: string[];
  listed: boolean;
}) {
  const risk_score = Math.min(100, input.heuristicScore + (input.listed ? 20 : 0));
  const risk_level = scoreToRiskLevel(risk_score);
  return {
    risk_score,
    risk_level,
    confidence: input.listed ? 88 : 72,
    threat_category: input.listed
      ? "Known malicious indicator"
      : risk_score >= 70
        ? "Suspected phishing"
        : risk_score >= 40
          ? "Suspicious URL"
          : "Benign",
    ai_explanation: input.listed
      ? "This URL matched public threat intelligence indicators. Treat it as hostile until proven otherwise."
      : input.reasons.length
        ? `Heuristic analysis flagged this URL due to: ${input.reasons.slice(0, 3).join("; ")}. Review carefully before visiting.`
        : "No strong malicious signals were detected. Continue practicing safe browsing habits.",
    recommendations: buildDefaultRecommendations(risk_level),
  };
}

function fallbackImageAnalysis(input: {
  heuristicScore: number;
  findingCount: number;
  categories: string[];
}) {
  const risk_score = input.heuristicScore;
  const risk_level = scoreToRiskLevel(risk_score);
  return {
    risk_score,
    risk_level,
    confidence: input.findingCount ? 84 : 65,
    ai_explanation: input.findingCount
      ? `OCR detected ${input.findingCount} sensitive item(s) including ${input.categories.slice(0, 3).join(", ")}. Sharing this screenshot could leak private credentials or identity data.`
      : "No high-confidence sensitive patterns were detected in the extracted text. Manual review is still recommended for images with poor OCR quality.",
    recommendations: buildDefaultRecommendations(risk_level, true),
  };
}

function buildDefaultRecommendations(level: RiskLevel, privacy = false): Recommendation[] {
  if (privacy) {
    return [
      {
        id: "blur",
        title: "Redact before sharing",
        description: "Blur emails, IDs, and secrets before posting screenshots.",
        priority: level === "safe" ? "optional" : "immediate",
      },
      {
        id: "rotate",
        title: "Rotate exposed secrets",
        description: "If credentials appeared, rotate them and enable MFA.",
        priority: ["high", "critical"].includes(level) ? "immediate" : "soon",
      },
    ];
  }
  return [
    {
      id: "avoid",
      title: "Do not visit unverified links",
      description: "Open only from trusted bookmarks or official apps.",
      priority: ["high", "critical"].includes(level) ? "immediate" : "soon",
    },
    {
      id: "report",
      title: "Report suspicious domains",
      description: "Forward phishing URLs to your security team or provider.",
      priority: "optional",
    },
  ];
}

export const aiService = {
  async analyzeUrl(input: {
    url: string;
    domain: string;
    protocol: string;
    heuristicScore: number;
    reasons: string[];
    signals: Record<string, unknown>;
    listed: boolean;
  }) {
    try {
      const raw = await completeJson(buildUrlAnalysisPrompt(input));
      if (raw) {
        const parsed = analysisSchema.parse(raw);
        logInfo("ai", "URL analysis completed via model");
        return {
          ...parsed,
          recommendations: parsed.recommendations.map((r, i) => ({
            id: `rec-${i}`,
            ...r,
          })),
        };
      }
    } catch (error) {
      logError("ai", "URL analysis fallback engaged", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return fallbackUrlAnalysis(input);
  },

  async analyzeImage(input: {
    fileName: string;
    findings: Array<{ category: string; label: string; value: string; risk_level: string }>;
    extractedTextPreview: string;
    heuristicScore: number;
  }) {
    try {
      const raw = await completeJson(buildImageAnalysisPrompt(input));
      if (raw) {
        const parsed = analysisSchema.parse(raw);
        return {
          ...parsed,
          recommendations: parsed.recommendations.map((r, i) => ({
            id: `rec-${i}`,
            ...r,
          })),
        };
      }
    } catch (error) {
      logError("ai", "Image analysis fallback engaged", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return fallbackImageAnalysis({
      heuristicScore: input.heuristicScore,
      findingCount: input.findings.length,
      categories: [...new Set(input.findings.map((f) => f.category))],
    });
  },

  async chat(input: {
    mode: "simple" | "technical" | "checklist";
    message: string;
    history: Array<{ role: "user" | "assistant" | "system"; content: string }>;
    scansContext: string;
  }) {
    const client = getClient();
    const prompt = buildCopilotPrompt(input);

    if (!client) {
      return fallbackChat(input);
    }

    try {
      const completion = await withRetry(() =>
        client.chat.completions.create({
          model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
          temperature: 0.4,
          messages: [
            { role: "system", content: SYSTEM_SECURITY_ANALYST },
            { role: "user", content: prompt },
          ],
        }),
      );
      return completion.choices[0]?.message?.content?.trim() || fallbackChat(input);
    } catch (error) {
      logError("ai", "Copilot fallback engaged", {
        error: error instanceof Error ? error.message : String(error),
      });
      return fallbackChat(input);
    }
  },
};

function fallbackChat(input: {
  mode: "simple" | "technical" | "checklist";
  message: string;
  scansContext: string;
}) {
  const lower = input.message.toLowerCase();
  if (input.mode === "checklist" || lower.includes("checklist")) {
    return `### Personalized safety checklist

- [ ] Verify sender domains before clicking links
- [ ] Never share OTPs, passwords, or UPI PINs
- [ ] Blur emails, IDs, and secrets in screenshots
- [ ] Enable MFA on email and banking accounts
- [ ] Re-scan suspicious URLs in RiskDetect AI before visiting

Based on your recent activity:
${input.scansContext || "No scans yet — run a URL or screenshot scan to personalize this further."}`;
  }

  if (lower.includes("dangerous") || lower.includes("explain")) {
    return `Here's a clear take:

Suspicious URLs often combine lookalike domains, urgent wording, and unusual protocols. Privacy leaks in screenshots expose emails, IDs, and secrets that attackers can reuse.

${input.scansContext || "Run a scan first so I can explain your specific findings."}

If something looks urgent and unexpected, pause and verify through an official channel.`;
  }

  return `I can help explain scan results, spot phishing patterns, and suggest safer habits.

${input.scansContext || "Tip: scan a URL or screenshot, then ask me about it."}

Try: "Explain this scan simply" or "Generate a checklist".`;
}
