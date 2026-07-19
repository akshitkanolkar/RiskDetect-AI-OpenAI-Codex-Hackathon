"use client";

import { useState } from "react";
import { BookOpen, Check, ChevronDown, Copy, Eye, EyeOff, Lightbulb, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ImageFinding } from "@/types/scans";
import { RiskBadge } from "@/components/common/risk-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  formatFindingValue,
  getFindingIcon,
  learnMoreUrl,
  SEVERITY_COLORS,
} from "@/lib/report/finding-meta";

export function FindingCard({ finding, index }: { finding: ImageFinding; index: number }) {
  const { toast } = useToast();
  const [hidden, setHidden] = useState(false);
  const [expanded, setExpanded] = useState(index < 2);
  const [copied, setCopied] = useState(false);
  const Icon = getFindingIcon(finding.category);
  const confidence = finding.confidence ?? 0;
  const accent = SEVERITY_COLORS[finding.risk_level];

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(finding.value);
      setCopied(true);
      toast({ title: "Copied to clipboard" });
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.4) }}
      className="group relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-surface-elevated/90 to-surface/80 p-5 shadow-low backdrop-blur transition-shadow hover:shadow-hover"
      style={{ borderLeftWidth: 3, borderLeftColor: accent }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: `color-mix(in oklab, ${accent} 18%, transparent)` }}
          >
            <Icon className="h-5 w-5" style={{ color: accent }} aria-hidden />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{finding.label}</p>
            <p className="mt-1 break-all font-mono text-sm text-brand">
              {formatFindingValue(finding.value, hidden)}
            </p>
          </div>
        </div>
        <RiskBadge level={finding.risk_level} label={`${finding.risk_level} risk`} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {confidence > 0 && (
          <Badge variant="outline" className="font-mono text-[11px]">
            {confidence}% confidence
          </Badge>
        )}
        {finding.validation_method && (
          <Badge variant="secondary" className="text-[11px]">
            {finding.validation_method}
          </Badge>
        )}
        {finding.risk_category && (
          <Badge variant="outline" className="text-[11px]">
            {finding.risk_category}
          </Badge>
        )}
      </div>

      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{finding.reason}</p>

      <div className="mt-3 rounded-xl border border-border/50 bg-muted/20 p-3">
        <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          <Lightbulb className="h-3 w-3 text-warning" aria-hidden />
          Recommendation
        </p>
        <p className="mt-1 text-sm text-foreground">{finding.recommendation}</p>
      </div>

      {(finding.start != null || finding.context) && (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" aria-hidden />
            {finding.start != null && finding.end != null
              ? `Chars ${finding.start}–${finding.end}`
              : "Document region"}
          </span>
          {finding.context && (
            <span className="rounded-md bg-muted/40 px-1.5 py-0.5 capitalize">
              Context · {finding.context}
            </span>
          )}
        </div>
      )}

      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-muted/60"
        role="img"
        aria-label={`${finding.risk_level} severity preview`}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${Math.max(12, confidence || RISK_FALLBACK[finding.risk_level])}%`,
            background: `linear-gradient(90deg, ${accent}, transparent)`,
          }}
        />
      </div>

      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <div className="mt-4 flex flex-wrap gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void handleCopy()}
            aria-label="Copy value"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            Copy
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setHidden((v) => !v)}
            aria-pressed={hidden}
            aria-label={hidden ? "Show value" : "Hide value"}
          >
            {hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            {hidden ? "Show" : "Hide"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(true)}
            aria-label="Explain finding"
          >
            <Lightbulb className="h-3.5 w-3.5" />
            Explain
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <a href={learnMoreUrl(finding.category)} target="_blank" rel="noopener noreferrer">
              <BookOpen className="h-3.5 w-3.5" />
              Learn more
            </a>
          </Button>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" aria-expanded={expanded}>
              <ChevronDown
                className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")}
              />
              {expanded ? "Collapse" : "Expand"}
            </Button>
          </CollapsibleTrigger>
        </div>
        <AnimatePresence initial={false}>
          {expanded && (
            <CollapsibleContent forceMount asChild>
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-2 rounded-xl border border-dashed border-border/60 bg-background/40 p-3 text-sm text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">Explain · </span>
                    Detected as <span className="text-foreground">{finding.label}</span>
                    {finding.validation_method
                      ? ` using ${finding.validation_method}`
                      : " via pattern validation"}
                    {finding.ocr_source ? ` (OCR: ${finding.ocr_source})` : ""}.
                  </p>
                  <p>{finding.reason}</p>
                </div>
              </motion.div>
            </CollapsibleContent>
          )}
        </AnimatePresence>
      </Collapsible>
    </motion.article>
  );
}

const RISK_FALLBACK = {
  critical: 96,
  high: 82,
  medium: 64,
  low: 40,
  safe: 18,
} as const;

export function FindingsGrid({ findings }: { findings: ImageFinding[] }) {
  if (!findings.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border/70 px-6 py-12 text-center">
        <p className="text-sm font-medium text-foreground">No sensitive entities confirmed</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Validators did not surface emails, IDs, payment handles, or secrets in this capture.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {findings.map((finding, index) => (
        <FindingCard key={finding.id} finding={finding} index={index} />
      ))}
    </div>
  );
}
