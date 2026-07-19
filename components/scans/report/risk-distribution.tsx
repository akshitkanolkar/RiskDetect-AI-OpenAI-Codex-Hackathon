"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import type { RiskLevel } from "@/types";
import { SEVERITY_COLORS } from "@/lib/report/finding-meta";
import { ChartContainer } from "@/components/charts/chart-container";
import { cn } from "@/lib/utils";

interface RiskDistributionProps {
  severity: Array<{ name: string; value: number; level: RiskLevel }>;
  entities: Array<{ name: string; count: number }>;
  className?: string;
}

export function RiskDistribution({ severity, entities, className }: RiskDistributionProps) {
  const hasSeverity = severity.some((s) => s.value > 0);
  const hasEntities = entities.length > 0;

  return (
    <div className={cn("grid gap-4 lg:grid-cols-2", className)}>
      <ChartContainer
        title="Severity breakdown"
        description="How findings distribute across risk levels"
        className="rounded-2xl"
      >
        {hasSeverity ? (
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={severity}
                dataKey="value"
                nameKey="name"
                innerRadius="58%"
                outerRadius="82%"
                paddingAngle={4}
                stroke="hsl(var(--background))"
                strokeWidth={2}
              >
                {severity.map((entry) => (
                  <Cell key={entry.level} fill={SEVERITY_COLORS[entry.level]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }} />
            </RechartsPieChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart message="No severity data yet" />
        )}
      </ChartContainer>

      <ChartContainer
        title="Entity types"
        description="Detected categories ranked by volume"
        className="rounded-2xl"
      >
        {hasEntities ? (
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart data={entities} margin={{ left: 0, right: 8 }}>
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                interval={0}
                angle={entities.length > 4 ? -28 : 0}
                textAnchor={entities.length > 4 ? "end" : "middle"}
                height={entities.length > 4 ? 70 : 40}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted) / 0.45)" }}
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                }}
              />
              <Bar dataKey="count" fill="hsl(var(--brand))" radius={[6, 6, 0, 0]} />
            </RechartsBarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart message="No entity categories detected" />
        )}
      </ChartContainer>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
