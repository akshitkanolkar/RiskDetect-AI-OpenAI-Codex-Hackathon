"use client";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
export function RiskTrendChart({
  data,
  xKey = "date",
  yKey = "score",
}: {
  data: Record<string, string | number>[];
  xKey?: string;
  yKey?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="risk-brand" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--brand))" stopOpacity={0.3} />
            <stop offset="100%" stopColor="hsl(var(--brand))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
        <XAxis
          dataKey={xKey}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
        />
        <YAxis
          domain={[0, 100]}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
        />
        <ReferenceLine y={50} stroke="hsl(var(--warning))" strokeDasharray="4 4" />
        <Tooltip
          contentStyle={{
            background: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 8,
          }}
        />
        <Area
          type="monotone"
          dataKey={yKey}
          stroke="hsl(var(--brand))"
          strokeWidth={2.5}
          fill="url(#risk-brand)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
