"use client";
import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
export function LineChart({
  data,
  xKey,
  yKey,
}: {
  data: Record<string, string | number>[];
  xKey: string;
  yKey: string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsLineChart data={data}>
        <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
        <XAxis
          dataKey={xKey}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
        />
        <Tooltip
          contentStyle={{
            background: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 8,
          }}
        />
        <Line
          type="monotone"
          dataKey={yKey}
          stroke="hsl(var(--brand))"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4, fill: "hsl(var(--brand))" }}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
