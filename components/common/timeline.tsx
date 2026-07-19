import * as React from "react";
import { cn } from "@/lib/utils";

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  status?: "default" | "success" | "warning" | "danger" | "info";
}

const statusColor: Record<NonNullable<TimelineItem["status"]>, string> = {
  default: "bg-muted-foreground",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
};

export function Timeline({
  items,
  className,
}: {
  items: TimelineItem[];
  className?: string;
}) {
  return (
    <ol className={cn("relative space-y-6 border-l border-border pl-6", className)}>
      {items.map((item) => (
        <li key={item.id} className="relative">
          <span
            className={cn(
              "absolute -left-[1.625rem] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-background",
              statusColor[item.status ?? "default"],
            )}
            aria-hidden="true"
          />
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
            <h3 className="text-sm font-medium text-foreground">{item.title}</h3>
            <time className="text-xs text-muted-foreground">{item.timestamp}</time>
          </div>
          {item.description && (
            <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
          )}
        </li>
      ))}
    </ol>
  );
}
