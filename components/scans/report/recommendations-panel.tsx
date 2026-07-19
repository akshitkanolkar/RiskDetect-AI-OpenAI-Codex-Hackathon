"use client";

import { AlertTriangle, CircleDot, Sparkles } from "lucide-react";
import type { Recommendation } from "@/types/scans";
import { Badge } from "@/components/ui/badge";
import { StaggerChildren, StaggerItem } from "@/components/animations/stagger-children";
import { cn } from "@/lib/utils";

const GROUPS: Array<{
  key: Recommendation["priority"];
  title: string;
  hint: string;
  accent: string;
}> = [
  {
    key: "immediate",
    title: "Immediate",
    hint: "Act before sharing or continuing",
    accent: "border-risk-critical/40 from-risk-critical/10",
  },
  {
    key: "soon",
    title: "Important",
    hint: "Reduce residual exposure soon",
    accent: "border-risk-high/40 from-risk-high/10",
  },
  {
    key: "optional",
    title: "Optional",
    hint: "Hardening and hygiene",
    accent: "border-brand/30 from-brand/10",
  },
];

export function RecommendationsPanel({
  items,
  className,
}: {
  items: Recommendation[];
  className?: string;
}) {
  if (!items.length) {
    return (
      <section className={cn("glass-panel rounded-2xl p-6", className)}>
        <h2 className="text-card-title">AI recommendations</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          No prioritized actions—keep monitoring and avoid oversharing metadata.
        </p>
      </section>
    );
  }

  return (
    <section className={cn("space-y-4", className)}>
      <div>
        <h2 className="text-card-title">AI recommendations</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Personalized actions ranked by urgency for this specific scan.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {GROUPS.map((group) => {
          const list = items.filter((item) => item.priority === group.key);
          return (
            <div
              key={group.key}
              className={cn("rounded-2xl border bg-gradient-to-b to-transparent p-4", group.accent)}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{group.title}</p>
                  <p className="text-xs text-muted-foreground">{group.hint}</p>
                </div>
                <Badge variant="outline">{list.length}</Badge>
              </div>
              {list.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing in this tier.</p>
              ) : (
                <StaggerChildren className="space-y-3">
                  {list.map((item) => (
                    <StaggerItem key={item.id}>
                      <article className="rounded-xl border border-border/50 bg-background/50 p-3 backdrop-blur-sm">
                        <div className="mb-1.5 flex items-start gap-2">
                          {group.key === "immediate" ? (
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-risk-critical" />
                          ) : group.key === "soon" ? (
                            <CircleDot className="mt-0.5 h-3.5 w-3.5 shrink-0 text-risk-high" />
                          ) : (
                            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                          )}
                          <h3 className="text-sm font-medium leading-snug">{item.title}</h3>
                        </div>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          {item.description}
                        </p>
                      </article>
                    </StaggerItem>
                  ))}
                </StaggerChildren>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
