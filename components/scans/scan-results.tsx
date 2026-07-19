"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import type { ImageScanRecord, UrlScanRecord } from "@/types/scans";
import { RiskGauge } from "@/components/scans/risk-gauge";
import { ConfidenceMeter } from "@/components/scans/confidence-meter";
import { RecommendationCards } from "@/components/scans/recommendation-cards";
import { Timeline } from "@/components/common/timeline";
import { RiskBadge } from "@/components/common/risk-badge";
import { FadeIn } from "@/components/animations/fade-in";
import { StaggerChildren, StaggerItem } from "@/components/animations/stagger-children";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/constants/routes";

export function UrlScanResult({ scan }: { scan: UrlScanRecord }) {
  return (
    <FadeIn className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={ROUTES.SCAN_URL}>
            <ArrowLeft className="h-4 w-4" />
            New scan
          </Link>
        </Button>
        <p className="text-xs text-muted-foreground">
          {format(new Date(scan.created_at), "MMM d, yyyy · HH:mm")}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="glass-panel rounded-2xl p-6 lg:col-span-2">
          <RiskGauge score={scan.risk_score} level={scan.risk_level} />
          <div className="mt-6 space-y-3">
            <ConfidenceMeter value={scan.confidence} />
            <div className="flex flex-wrap gap-2">
              <RiskBadge level={scan.risk_level} />
              <Badge variant="outline">{scan.threat_category}</Badge>
            </div>
            <p className="break-all font-mono text-xs text-muted-foreground">{scan.normalized_url}</p>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-3">
          <div className="glass-panel rounded-2xl p-6">
            <h2 className="text-card-title">AI explanation</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {scan.ai_explanation}
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-6">
            <h2 className="mb-4 text-card-title">Why this score</h2>
            <ul className="space-y-2">
              {scan.reasons.map((reason) => (
                <li key={reason} className="flex gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <StaggerChildren className="space-y-6">
        <StaggerItem>
          <div className="glass-panel rounded-2xl p-6">
            <h2 className="mb-4 text-card-title">Recommendations</h2>
            <RecommendationCards items={scan.recommendations} />
          </div>
        </StaggerItem>
        <StaggerItem>
          <div className="glass-panel rounded-2xl p-6">
            <h2 className="mb-4 text-card-title">Analysis timeline</h2>
            <Timeline
              items={scan.timeline.map((event) => ({
                id: event.id,
                title: event.label,
                description: event.detail,
                timestamp: format(new Date(event.at), "HH:mm:ss"),
                status: event.status,
              }))}
            />
          </div>
        </StaggerItem>
      </StaggerChildren>
    </FadeIn>
  );
}

export function ImageScanResult({ scan }: { scan: ImageScanRecord }) {
  return (
    <FadeIn className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={ROUTES.SCAN_IMAGE}>
            <ArrowLeft className="h-4 w-4" />
            New scan
          </Link>
        </Button>
        <p className="text-xs text-muted-foreground">
          {format(new Date(scan.created_at), "MMM d, yyyy · HH:mm")}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="glass-panel rounded-2xl p-6 lg:col-span-2">
          <RiskGauge score={scan.risk_score} level={scan.risk_level} />
          <div className="mt-6 space-y-3">
            <ConfidenceMeter value={scan.confidence} />
            <RiskBadge level={scan.risk_level} />
            <p className="text-sm text-muted-foreground">{scan.file_name}</p>
          </div>
        </div>
        <div className="glass-panel rounded-2xl p-6 lg:col-span-3">
          <h2 className="text-card-title">AI explanation</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {scan.ai_explanation}
          </p>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-6">
        <h2 className="mb-4 text-card-title">Highlighted findings</h2>
        {scan.findings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sensitive patterns detected.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {scan.findings.map((finding) => (
              <div key={finding.id} className="rounded-xl border border-border/60 bg-muted/20 p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{finding.label}</p>
                  <RiskBadge level={finding.risk_level} />
                </div>
                <p className="break-all font-mono text-xs text-brand">{finding.value}</p>
                <p className="mt-2 text-xs text-muted-foreground">{finding.reason}</p>
                <p className="mt-1 text-xs text-foreground">{finding.recommendation}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {scan.extracted_text && (
        <div className="glass-panel rounded-2xl p-6">
          <h2 className="mb-3 text-card-title">Extracted text</h2>
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-xl bg-muted/40 p-4 font-mono text-xs text-muted-foreground">
            {scan.extracted_text}
          </pre>
        </div>
      )}

      <div className="glass-panel rounded-2xl p-6">
        <h2 className="mb-4 text-card-title">Recommendations</h2>
        <RecommendationCards items={scan.recommendations} />
      </div>
    </FadeIn>
  );
}
