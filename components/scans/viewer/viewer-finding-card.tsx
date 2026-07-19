"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Copy, Crosshair, EyeOff, Flag, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import type { ImageFinding } from "@/types/scans";
import { RiskBadge } from "@/components/common/risk-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { formatFindingValue, getFindingIcon, SEVERITY_COLORS } from "@/lib/report/finding-meta";
import { riskScoreForFinding } from "@/lib/viewer/map-ocr-boxes";
import { cn } from "@/lib/utils";

interface ViewerFindingCardProps {
  finding: ImageFinding;
  selected: boolean;
  onLocate: (id: string) => void;
  onIgnore: (id: string) => void;
  privacyBlur: boolean;
}

export function ViewerFindingCard({
  finding,
  selected,
  onLocate,
  onIgnore,
  privacyBlur,
}: ViewerFindingCardProps) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(selected);
  const [hidden, setHidden] = useState(privacyBlur);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const Icon = getFindingIcon(finding.category);
  const accent = SEVERITY_COLORS[finding.risk_level];

  useEffect(() => {
    if (selected) {
      setExpanded(true);
      ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selected]);

  useEffect(() => {
    setHidden(privacyBlur);
  }, [privacyBlur]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(finding.value);
      setCopied(true);
      toast({ title: "Copied" });
      setTimeout(() => setCopied(false), 1200);
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  }

  return (
    <motion.article
      ref={ref}
      layout
      id={`finding-${finding.id}`}
      className={cn(
        "rounded-2xl border bg-gradient-to-br from-surface-elevated to-surface p-4 transition-shadow",
        selected
          ? "border-brand shadow-hover ring-1 ring-brand/40"
          : "border-border/60 hover:border-border",
      )}
      style={{ borderLeftWidth: 3, borderLeftColor: accent }}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") onLocate(finding.id);
      }}
      aria-selected={selected}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{
              backgroundColor: `color-mix(in oklab, ${accent} 18%, transparent)`,
              color: accent,
            }}
          >
            <Icon className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">{finding.label}</p>
            <p className="mt-0.5 break-all font-mono text-xs text-brand">
              {formatFindingValue(finding.value, hidden)}
            </p>
          </div>
        </div>
        <RiskBadge level={finding.risk_level} />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {(finding.confidence ?? 0) > 0 && (
          <Badge variant="outline" className="font-mono text-[10px]">
            {finding.confidence}% conf
          </Badge>
        )}
        <Badge variant="secondary" className="font-mono text-[10px]">
          Risk {riskScoreForFinding(finding.risk_level)}
        </Badge>
        {finding.validation_method && (
          <Badge variant="outline" className="text-[10px]">
            {finding.validation_method}
          </Badge>
        )}
      </div>

      <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{finding.reason}</p>
      <p className="mt-1 text-xs text-foreground">{finding.recommendation}</p>

      {finding.bbox && (
        <p className="mt-2 flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
          <MapPin className="h-3 w-3" aria-hidden />({Math.round(finding.bbox.x)},{" "}
          {Math.round(finding.bbox.y)}) · {Math.round(finding.bbox.width)}×
          {Math.round(finding.bbox.height)}px
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-1">
        <Button
          variant="secondary"
          size="sm"
          className="h-7 text-xs"
          onClick={() => onLocate(finding.id)}
          disabled={!finding.bbox}
        >
          <Crosshair className="h-3 w-3" />
          Locate
        </Button>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => void copy()}>
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          Copy
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => setHidden((v) => !v)}
        >
          <EyeOff className="h-3 w-3" />
          Blur
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => onIgnore(finding.id)}
        >
          Ignore
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() =>
            toast({
              title: "False positive reported",
              description: "Thanks — this helps improve detection quality.",
            })
          }
        >
          <Flag className="h-3 w-3" />
          Report
        </Button>
        <Collapsible open={expanded} onOpenChange={setExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 text-xs">
              <ChevronDown
                className={cn("h-3 w-3 transition-transform", expanded && "rotate-180")}
              />
              Details
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 space-y-1 rounded-lg border border-dashed border-border/60 p-2 text-xs text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">Explanation · </span>
                {finding.reason}
              </p>
              {finding.ocr_source && <p>OCR source: {finding.ocr_source}</p>}
              {finding.context && <p>Context strength: {finding.context}</p>}
              {finding.risk_category && <p>Category: {finding.risk_category}</p>}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </motion.article>
  );
}
