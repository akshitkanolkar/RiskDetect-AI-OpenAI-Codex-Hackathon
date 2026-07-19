import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
type RiskLevel = "critical" | "high" | "medium" | "low" | "safe";
interface RiskBadgeProps extends React.ComponentProps<typeof Badge> {
  level: RiskLevel;
  label?: string;
}
const riskClasses: Record<RiskLevel, string> = {
  critical: "risk-critical",
  high: "risk-high",
  medium: "risk-medium",
  low: "risk-low",
  safe: "risk-safe",
};
function RiskBadge({ level, label, className, ...props }: RiskBadgeProps) {
  return (
    <Badge variant="outline" className={cn("capitalize", riskClasses[level], className)} {...props}>
      {label ?? level}
    </Badge>
  );
}
export { RiskBadge };
