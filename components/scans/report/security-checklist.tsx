"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { motion } from "framer-motion";
import type { ChecklistItem } from "@/lib/report/derive-intelligence";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

export function SecurityChecklist({
  items: initial,
  className,
}: {
  items: ChecklistItem[];
  className?: string;
}) {
  const [items, setItems] = useState(initial);

  const { done, total, percent } = useMemo(() => {
    const relevant = items.filter((i) => i.required || !i.completed);
    const list = relevant.length ? items.filter((i) => i.required) : items;
    const target = list.length ? list : items;
    const completed = target.filter((i) => i.completed).length;
    return {
      done: completed,
      total: target.length,
      percent: target.length ? Math.round((completed / target.length) * 100) : 100,
    };
  }, [items]);

  function toggle(id: string) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item)),
    );
  }

  return (
    <section className={cn("glass-panel rounded-2xl p-6", className)}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-card-title">Security checklist</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Track remediation for entities present in this scan.
          </p>
        </div>
        <p className="font-mono text-sm tabular-nums text-muted-foreground">
          {done}/{total} complete · {percent}%
        </p>
      </div>

      <Progress value={percent} className="mb-5 h-2" />

      <ul className="space-y-2">
        {items.map((item, index) => (
          <motion.li
            key={item.id}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.04 }}
          >
            <button
              type="button"
              onClick={() => toggle(item.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                item.completed
                  ? "border-success/30 bg-success/5 text-muted-foreground"
                  : "border-border/60 bg-background/40 hover:border-brand/40",
                item.required && !item.completed && "border-risk-high/30",
              )}
              aria-pressed={item.completed}
            >
              {item.completed ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-success" aria-hidden />
              ) : (
                <Circle className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
              )}
              <span
                className={cn(
                  "flex-1 text-sm",
                  item.completed && "line-through decoration-muted-foreground/60",
                )}
              >
                {item.label}
              </span>
              {item.required && (
                <span className="text-[10px] uppercase tracking-wider text-risk-high">
                  Required
                </span>
              )}
            </button>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
