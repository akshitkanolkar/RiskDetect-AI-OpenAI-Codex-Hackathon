"use client";

import { format } from "date-fns";
import { motion } from "framer-motion";
import type { TimelineEvent } from "@/types/scans";
import { cn } from "@/lib/utils";

const STATUS_RING: Record<TimelineEvent["status"], string> = {
  success: "bg-success ring-success/30",
  warning: "bg-warning ring-warning/30",
  danger: "bg-danger ring-danger/30",
  info: "bg-info ring-info/30",
  default: "bg-muted-foreground ring-muted/40",
};

export function RiskTimeline({
  events,
  className,
}: {
  events: TimelineEvent[];
  className?: string;
}) {
  return (
    <section className={cn("glass-panel rounded-2xl p-6", className)}>
      <h2 className="text-card-title">Risk timeline</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Animated path from ingest through AI synthesis to completion.
      </p>

      <ol className="mt-8 flex flex-col gap-0 md:flex-row md:items-stretch md:justify-between md:gap-2">
        {events.map((event, index) => (
          <li
            key={event.id}
            className="relative flex flex-1 gap-4 md:flex-col md:items-center md:gap-3"
          >
            {index < events.length - 1 && (
              <span
                className="absolute left-[11px] top-6 h-[calc(100%-8px)] w-px bg-border md:left-1/2 md:top-[11px] md:h-px md:w-full"
                aria-hidden
              />
            )}
            <motion.span
              className={cn(
                "relative z-10 mt-1 h-6 w-6 shrink-0 rounded-full ring-4 md:mt-0",
                STATUS_RING[event.status],
              )}
              initial={{ scale: 0.4, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, type: "spring", stiffness: 260, damping: 18 }}
              aria-hidden
            />
            <motion.div
              className="pb-6 md:pb-0 md:text-center"
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.08 + index * 0.1 }}
            >
              <p className="text-sm font-semibold">{event.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground md:mx-auto md:max-w-[140px]">
                {event.detail}
              </p>
              <time className="mt-2 block font-mono text-[10px] text-muted-foreground">
                {format(new Date(event.at), "HH:mm:ss.SSS")}
              </time>
            </motion.div>
          </li>
        ))}
      </ol>
    </section>
  );
}
