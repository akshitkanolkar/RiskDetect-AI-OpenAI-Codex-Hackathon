import { cn } from "@/lib/utils";
const riskStyles = {
  safe: "bg-[hsl(var(--risk-safe))]",
  low: "bg-[hsl(var(--risk-low))]",
  medium: "bg-[hsl(var(--risk-medium))]",
  high: "bg-[hsl(var(--risk-high))]",
  critical: "bg-[hsl(var(--risk-critical))]",
};
export function RiskCard({
  level,
  score,
  description,
}: {
  level: keyof typeof riskStyles;
  score: number;
  description?: string;
}) {
  const clamped = Math.max(0, Math.min(score, 100));
  return (
    <div className="glass-panel rounded-xl p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Risk level</p>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-semibold capitalize text-white",
            riskStyles[level],
          )}
        >
          {level}
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold">
        {clamped}
        <span className="text-base text-muted-foreground">/100</span>
      </p>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", riskStyles[level])}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {description && <p className="mt-3 text-xs text-muted-foreground">{description}</p>}
    </div>
  );
}
