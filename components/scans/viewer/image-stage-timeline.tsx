"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const STAGES = [
  { id: "uploaded", label: "Uploaded" },
  { id: "ocr", label: "OCR" },
  { id: "detection", label: "Detection" },
  { id: "validation", label: "Validation" },
  { id: "ai", label: "AI Analysis" },
  { id: "completed", label: "Completed" },
] as const;

export function ImageStageTimeline({ className }: { className?: string }) {
  return (
    <ol
      className={cn(
        "flex flex-wrap items-center gap-1 rounded-xl border border-border/50 bg-muted/20 px-3 py-2",
        className,
      )}
      aria-label="Scan pipeline stages"
    >
      {STAGES.map((stage, index) => (
        <li key={stage.id} className="flex items-center gap-1">
          <motion.span
            className="rounded-full bg-brand/15 px-2.5 py-1 text-[11px] font-medium text-brand"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
          >
            {stage.label}
          </motion.span>
          {index < STAGES.length - 1 && (
            <span className="px-0.5 text-muted-foreground" aria-hidden>
              →
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}
