"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ImageScanRecord, UrlScanRecord } from "@/types/scans";
import { deriveImageReport, deriveUrlReport } from "@/lib/report/derive-intelligence";
import { FadeIn } from "@/components/animations/fade-in";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { ReportHero } from "@/components/scans/report/report-hero";
import { ExecutiveSummary } from "@/components/scans/report/executive-summary";
import { FindingsGrid } from "@/components/scans/report/finding-card";
import { RiskDistribution } from "@/components/scans/report/risk-distribution";
import { ImageViewer } from "@/components/scans/viewer/image-viewer";
import { TextHeatmap } from "@/components/scans/report/text-heatmap";
import { PrivacyScorePanel } from "@/components/scans/report/privacy-score";
import { RecommendationsPanel } from "@/components/scans/report/recommendations-panel";
import { ThreatIntelligence } from "@/components/scans/report/threat-intelligence";
import { SecurityChecklist } from "@/components/scans/report/security-checklist";
import {
  ScanMetadata,
  buildImageMetadata,
  buildUrlMetadata,
} from "@/components/scans/report/scan-metadata";
import { RiskTimeline } from "@/components/scans/report/risk-timeline";
import { DownloadReport } from "@/components/scans/report/download-report";
import { RelatedHistory } from "@/components/scans/report/related-history";
import { DetectionOrderTimeline } from "@/components/scans/report/detection-order";
import { RiskBadge } from "@/components/common/risk-badge";
import { SEVERITY_COLORS, getFindingIcon } from "@/lib/report/finding-meta";

function ReportNav({ href, label }: { href: string; label: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Button variant="ghost" size="sm" asChild>
        <Link href={href}>
          <ArrowLeft className="h-4 w-4" />
          {label}
        </Link>
      </Button>
      <p className="text-xs text-muted-foreground">SafeLens Security Intelligence Report</p>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h2 className="text-card-title">{children}</h2>
    </div>
  );
}

export function ImageScanResult({ scan }: { scan: ImageScanRecord }) {
  const report = deriveImageReport(scan);

  return (
    <FadeIn className="space-y-10">
      <ReportNav href={ROUTES.SCAN_IMAGE} label="New image scan" />

      <ReportHero
        riskScore={scan.risk_score}
        riskLevel={scan.risk_level}
        confidence={scan.confidence}
        findings={report.stats.findings}
        sensitive={report.stats.sensitive}
        threats={report.stats.threats}
        processingMs={report.stats.processingMs}
        model={report.stats.model}
        date={scan.created_at}
        subtitle={scan.file_name}
      />

      <ImageViewer scan={scan} />

      <ExecutiveSummary summary={report.executiveSummary} />

      <section>
        <SectionLabel>Highlighted findings</SectionLabel>
        <FindingsGrid findings={report.findings} />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-card-title">Risk distribution</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Severity mix, entity volume, and detection sequence.
          </p>
        </div>
        <RiskDistribution severity={report.severityBreakdown} entities={report.entityBreakdown} />
        <DetectionOrderTimeline findings={report.findings} />
      </section>

      <TextHeatmap text={scan.extracted_text} findings={report.findings} />

      <PrivacyScorePanel privacy={report.privacy} />

      <RecommendationsPanel items={report.recommendations} />

      <ThreatIntelligence scenarios={report.scenarios} />

      <SecurityChecklist items={report.checklist} />

      <ScanMetadata
        items={buildImageMetadata({
          confidence: scan.confidence,
          processingMs: report.stats.processingMs,
          fileSize: scan.file_size,
          mimeType: scan.mime_type,
          fileName: scan.file_name,
          wordsExtracted: report.stats.wordsExtracted,
          entitiesFound: report.findings.length,
          timestamp: scan.created_at,
          model: report.stats.model,
        })}
      />

      <RiskTimeline events={report.timeline} />

      <DownloadReport
        payload={{
          title: "SafeLens AI · Image Security Intelligence Report",
          target: scan.file_name,
          riskScore: scan.risk_score,
          riskLevel: scan.risk_level,
          confidence: scan.confidence,
          summary: report.executiveSummary,
          findings: report.findings.map((f) => ({
            label: f.label,
            value: f.value,
            risk: f.risk_level,
            recommendation: f.recommendation,
          })),
          recommendations: report.recommendations,
          scenarios: report.scenarios,
          privacy: report.privacy,
          timestamp: scan.created_at,
        }}
      />

      <RelatedHistory currentId={scan.id} />
    </FadeIn>
  );
}

export function UrlScanResult({ scan }: { scan: UrlScanRecord }) {
  const report = deriveUrlReport(scan);

  return (
    <FadeIn className="space-y-10">
      <ReportNav href={ROUTES.SCAN_URL} label="New URL scan" />

      <ReportHero
        riskScore={scan.risk_score}
        riskLevel={scan.risk_level}
        confidence={scan.confidence}
        findings={report.stats.findings}
        sensitive={report.stats.sensitive}
        threats={report.stats.threats}
        processingMs={report.stats.processingMs}
        model={report.stats.model}
        date={scan.created_at}
        subtitle={scan.normalized_url}
      />

      <ExecutiveSummary summary={report.executiveSummary} />

      <section>
        <SectionLabel>Detected signals</SectionLabel>
        {report.signalCards.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/70 px-6 py-12 text-center">
            <p className="text-sm font-medium">No elevated signals</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Heuristics and threat feeds did not raise material concerns for this URL.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {report.signalCards.map((signal) => {
              const Icon = getFindingIcon("url");
              return (
                <article
                  key={signal.id}
                  className="rounded-2xl border border-border/60 bg-gradient-to-br from-surface-elevated to-surface p-5"
                  style={{
                    borderLeftWidth: 3,
                    borderLeftColor: SEVERITY_COLORS[signal.severity],
                  }}
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="flex h-9 w-9 items-center justify-center rounded-xl"
                        style={{
                          backgroundColor: `color-mix(in oklab, ${SEVERITY_COLORS[signal.severity]} 18%, transparent)`,
                          color: SEVERITY_COLORS[signal.severity],
                        }}
                      >
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      <h3 className="text-sm font-semibold">{signal.title}</h3>
                    </div>
                    <RiskBadge level={signal.severity} />
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{signal.detail}</p>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <RiskDistribution
        severity={[
          {
            name: scan.risk_level.charAt(0).toUpperCase() + scan.risk_level.slice(1),
            value: 1,
            level: scan.risk_level,
          },
        ]}
        entities={[
          { name: "Keywords", count: scan.signals.suspiciousKeywords.length || 0 },
          {
            name: "Threat feeds",
            count:
              (scan.signals.listedInUrlhaus ? 1 : 0) + (scan.signals.listedInOpenPhish ? 1 : 0),
          },
          { name: "Homoglyph", count: scan.signals.hasHomoglyph ? 1 : 0 },
          { name: "IP host", count: scan.signals.hasIpHost ? 1 : 0 },
        ].filter((e) => e.count > 0)}
      />

      <PrivacyScorePanel privacy={report.privacy} />

      <RecommendationsPanel items={report.recommendations} />

      <ThreatIntelligence scenarios={report.scenarios} />

      <SecurityChecklist items={report.checklist} />

      <ScanMetadata
        items={buildUrlMetadata({
          confidence: scan.confidence,
          processingMs: report.stats.processingMs,
          domain: scan.domain,
          protocol: scan.protocol,
          category: scan.threat_category,
          timestamp: scan.created_at,
          model: report.stats.model,
          heuristicScore: scan.signals.heuristicScore,
        })}
      />

      <RiskTimeline events={report.timeline} />

      <DownloadReport
        payload={{
          title: "SafeLens AI · URL Security Intelligence Report",
          target: scan.normalized_url,
          riskScore: scan.risk_score,
          riskLevel: scan.risk_level,
          confidence: scan.confidence,
          summary: report.executiveSummary,
          findings: report.signalCards.map((s) => ({
            label: s.title,
            value: scan.normalized_url,
            risk: s.severity,
            recommendation: s.detail,
          })),
          recommendations: report.recommendations,
          scenarios: report.scenarios,
          privacy: report.privacy,
          timestamp: scan.created_at,
        }}
      />

      <RelatedHistory currentId={scan.id} />
    </FadeIn>
  );
}
