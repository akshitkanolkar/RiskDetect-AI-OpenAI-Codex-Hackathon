export const SYSTEM_SECURITY_ANALYST = `You are RiskDetect AI, an expert digital risk analyst.
Return concise, accurate security assessments.
Never invent feeds or evidence that was not provided.
Prefer actionable recommendations.
Respond with valid JSON only when asked for JSON.`;

export function buildUrlAnalysisPrompt(payload: {
  url: string;
  domain: string;
  protocol: string;
  heuristicScore: number;
  reasons: string[];
  signals: Record<string, unknown>;
}) {
  return `Analyze this URL risk assessment context and return JSON with keys:
risk_score (0-100), risk_level (safe|low|medium|high|critical), confidence (0-100),
threat_category (string), ai_explanation (2-4 sentences), recommendations (array of {title, description, priority}).

Weight typosquatting, brand impersonation, and homoglyph signals heavily when present.
If an officialDomain / matchedBrand is provided for a lookalike, recommend using that official site.
Explain visually deceptive characters when relevant (e.g. "rn" for "m", digit substitutions).

URL: ${payload.url}
Domain: ${payload.domain}
Protocol: ${payload.protocol}
Heuristic score: ${payload.heuristicScore}
Signals: ${JSON.stringify(payload.signals)}
Reasons already found: ${JSON.stringify(payload.reasons)}`;
}

export function buildImageAnalysisPrompt(payload: {
  fileName: string;
  findings: Array<{ category: string; label: string; value: string; risk_level: string }>;
  extractedTextPreview: string;
  heuristicScore: number;
}) {
  return `Analyze screenshot privacy exposure and return JSON with keys:
risk_score (0-100), risk_level (safe|low|medium|high|critical), confidence (0-100),
ai_explanation (2-4 sentences), recommendations (array of {title, description, priority}).

IMPORTANT: A URL finding marked high/critical for typosquatting or brand impersonation must NOT be summarized as safe.
A syntactically valid URL is not trustworthy by default — weight phishing URL findings heavily.
If heuristic score is high due to phishing URLs, risk_score must remain high/critical.

File: ${payload.fileName}
Heuristic score: ${payload.heuristicScore}
Findings: ${JSON.stringify(payload.findings)}
OCR preview: ${payload.extractedTextPreview.slice(0, 1500)}`;
}

export function buildCopilotPrompt(payload: {
  mode: "simple" | "technical" | "checklist";
  message: string;
  history: Array<{ role: string; content: string }>;
  scansContext: string;
}) {
  const tone =
    payload.mode === "technical"
      ? "Respond with technical depth suitable for security engineers."
      : payload.mode === "checklist"
        ? "Respond as a personalized actionable checklist with markdown checkboxes."
        : "Respond in plain language for a non-expert user.";

  return `${tone}

Recent scan context:
${payload.scansContext || "No prior scans available."}

Conversation:
${payload.history.map((m) => `${m.role}: ${m.content}`).join("\n")}

User: ${payload.message}

Assistant:`;
}
