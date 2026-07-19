import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatsCard({
  icon: Icon,
  label,
  value,
  delta,
  trend = "neutral",
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  delta?: string;
  trend?: "up" | "down" | "neutral";
}) {
  const TrendIcon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;
  return (
    <div className="glass-panel rounded-xl p-5">
      <div className="flex items-start justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className="rounded-lg bg-brand/10 p-2 text-brand">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-tight">{value}</p>
      {delta && (
        <p
          className={cn(
            "mt-2 flex items-center gap-1 text-xs",
            trend === "up"
              ? "text-success"
              : trend === "down"
                ? "text-destructive"
                : "text-muted-foreground",
          )}
        >
          <TrendIcon className="h-3.5 w-3.5" />
          {delta}
        </p>
      )}
    </div>
  );
}
