"use client";

import { useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Recommendation } from "@/types/scans";
import type { PrivacyExposure, ThreatScenario } from "@/lib/report/derive-intelligence";
import type { RiskLevel } from "@/types";

export interface ReportDownloadPayload {
  title: string;
  target: string;
  riskScore: number;
  riskLevel: RiskLevel;
  confidence: number;
  summary: string;
  findings: Array<{ label: string; value: string; risk: string; recommendation: string }>;
  recommendations: Recommendation[];
  scenarios: ThreatScenario[];
  privacy: PrivacyExposure;
  timestamp: string;
}

function buildReportHtml(payload: ReportDownloadPayload): string {
  const findingsRows = payload.findings
    .map(
      (f) =>
        `<tr><td>${escapeHtml(f.label)}</td><td><code>${escapeHtml(f.value)}</code></td><td>${escapeHtml(f.risk)}</td><td>${escapeHtml(f.recommendation)}</td></tr>`,
    )
    .join("");

  const recs = payload.recommendations
    .map(
      (r) =>
        `<li><strong>[${r.priority}] ${escapeHtml(r.title)}</strong> — ${escapeHtml(r.description)}</li>`,
    )
    .join("");

  const scenarios = payload.scenarios
    .map(
      (s) =>
        `<li><strong>${escapeHtml(s.title)}</strong> (${s.likelihood}, ${s.probability}%) — ${escapeHtml(s.description)}</li>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>${escapeHtml(payload.title)}</title>
<style>
  :root { color-scheme: light; }
  body { font-family: "Plus Jakarta Sans", system-ui, sans-serif; color: #0f172a; margin: 0; padding: 40px; background: #f8fafc; }
  h1 { font-size: 28px; margin: 0 0 8px; }
  h2 { font-size: 16px; margin: 28px 0 10px; letter-spacing: 0.02em; text-transform: uppercase; color: #0e7490; }
  .meta { color: #64748b; font-size: 13px; }
  .score { display: inline-block; padding: 12px 18px; border-radius: 12px; background: #ecfeff; border: 1px solid #a5f3fc; margin: 16px 0; }
  .score strong { font-size: 32px; font-variant-numeric: tabular-nums; }
  p { line-height: 1.6; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; vertical-align: top; }
  th { background: #f1f5f9; }
  code { font-family: ui-monospace, monospace; font-size: 11px; }
  ul { padding-left: 18px; }
  li { margin-bottom: 8px; line-height: 1.5; }
  footer { margin-top: 40px; font-size: 11px; color: #94a3b8; }
  @media print { body { background: white; padding: 16px; } }
</style>
</head>
<body>
  <h1>${escapeHtml(payload.title)}</h1>
  <p class="meta">Target: ${escapeHtml(payload.target)} · Generated ${escapeHtml(format(new Date(payload.timestamp), "PPpp"))}</p>
  <div class="score">
    Overall risk <strong>${payload.riskScore}</strong> · ${payload.riskLevel.toUpperCase()} · Confidence ${payload.confidence}%
  </div>
  <h2>Executive summary</h2>
  <p>${escapeHtml(payload.summary)}</p>
  <h2>Privacy exposure</h2>
  <p>Identity ${payload.privacy.identity}% · Financial ${payload.privacy.financial}% · Credentials ${payload.privacy.credentials}% · Communication ${payload.privacy.communication}% · Overall ${payload.privacy.overall}%</p>
  <h2>Findings</h2>
  ${
    payload.findings.length
      ? `<table><thead><tr><th>Type</th><th>Value</th><th>Severity</th><th>Recommendation</th></tr></thead><tbody>${findingsRows}</tbody></table>`
      : "<p>No sensitive findings.</p>"
  }
  <h2>Recommendations</h2>
  <ul>${recs || "<li>None</li>"}</ul>
  <h2>Threat scenarios</h2>
  <ul>${scenarios}</ul>
  <footer>SafeLens AI · Security Intelligence Report · Confidential</footer>
  <script>window.onload = () => { window.print(); };</script>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function DownloadReport({
  payload,
  className,
}: {
  payload: ReportDownloadPayload;
  className?: string;
}) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  function handleDownload() {
    setBusy(true);
    try {
      const html = buildReportHtml(payload);
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, "_blank", "noopener,noreferrer");
      if (!win) {
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `safelens-report-${format(new Date(payload.timestamp), "yyyyMMdd-HHmm")}.html`;
        anchor.click();
        toast({
          title: "Report downloaded",
          description: "Open the HTML file and print to PDF for a permanent copy.",
        });
      } else {
        toast({
          title: "Report ready",
          description: "Use Print → Save as PDF in the opened window.",
        });
      }
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch {
      toast({ title: "Could not generate report", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-brand/25 bg-gradient-to-br from-brand/15 via-surface to-surface-elevated p-6 sm:p-8",
        className,
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/20 text-brand">
            <FileText className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h2 className="text-card-title">Download report</h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Export a professional Security Intelligence Report with summary, findings,
              recommendations, privacy scores, and timestamp—then save as PDF from print.
            </p>
          </div>
        </div>
        <Button size="lg" onClick={handleDownload} disabled={busy} className="shrink-0 gap-2">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Download PDF report
        </Button>
      </div>
    </section>
  );
}
