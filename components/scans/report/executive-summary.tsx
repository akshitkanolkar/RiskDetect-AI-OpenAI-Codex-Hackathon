"use client";

import { Quote } from "lucide-react";
import { FadeIn } from "@/components/animations/fade-in";
import { cn } from "@/lib/utils";

export function ExecutiveSummary({ summary, className }: { summary: string; className?: string }) {
  return (
    <FadeIn>
      <section
        className={cn("glass-panel relative overflow-hidden rounded-2xl p-6 sm:p-8", className)}
        aria-labelledby="executive-summary-title"
      >
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-brand via-brand/60 to-transparent"
          aria-hidden
        />
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand">
            <Quote className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <p className="text-label text-brand">Executive AI summary</p>
            <h2 id="executive-summary-title" className="text-card-title mt-1">
              What this means for you
            </h2>
            <p className="mt-4 text-base leading-relaxed text-foreground/90 sm:text-[15px]">
              {summary}
            </p>
          </div>
        </div>
      </section>
    </FadeIn>
  );
}
