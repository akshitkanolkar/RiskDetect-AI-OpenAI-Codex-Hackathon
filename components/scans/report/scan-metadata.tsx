"use client";

import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { formatBytes, formatDuration } from "@/lib/report/derive-intelligence";

export interface ScanMetadataProps {
  items: Array<{ label: string; value: string }>;
  className?: string;
}

export function ScanMetadata({ items, className }: ScanMetadataProps) {
  return (
    <section className={cn("glass-panel rounded-2xl p-6", className)}>
      <h2 className="text-card-title">Scan metadata</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Pipeline provenance for audit and reproducibility.
      </p>
      <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-border/50 bg-muted/15 px-3 py-2.5"
          >
            <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {item.label}
            </dt>
            <dd className="mt-1 break-all font-mono text-sm text-foreground">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function buildImageMetadata(input: {
  confidence: number;
  processingMs: number;
  fileSize: number;
  mimeType: string;
  fileName: string;
  wordsExtracted: number;
  entitiesFound: number;
  timestamp: string;
  model: string;
}): Array<{ label: string; value: string }> {
  return [
    { label: "OCR confidence", value: `${input.confidence}%` },
    { label: "Model version", value: input.model },
    { label: "Scan duration", value: formatDuration(input.processingMs) },
    { label: "File size", value: formatBytes(input.fileSize) },
    { label: "MIME type", value: input.mimeType },
    { label: "Source file", value: input.fileName },
    { label: "Language", value: "eng (OCR)" },
    { label: "Words extracted", value: String(input.wordsExtracted) },
    { label: "Entities found", value: String(input.entitiesFound) },
    {
      label: "Processing timestamp",
      value: format(new Date(input.timestamp), "yyyy-MM-dd HH:mm:ss"),
    },
  ];
}

export function buildUrlMetadata(input: {
  confidence: number;
  processingMs: number;
  domain: string;
  protocol: string;
  category: string;
  timestamp: string;
  model: string;
  heuristicScore: number;
}): Array<{ label: string; value: string }> {
  return [
    { label: "Analysis confidence", value: `${input.confidence}%` },
    { label: "Model version", value: input.model },
    { label: "Scan duration", value: formatDuration(input.processingMs) },
    { label: "Domain", value: input.domain },
    { label: "Protocol", value: input.protocol },
    { label: "Threat category", value: input.category },
    { label: "Heuristic score", value: String(input.heuristicScore) },
    {
      label: "Processing timestamp",
      value: format(new Date(input.timestamp), "yyyy-MM-dd HH:mm:ss"),
    },
  ];
}
