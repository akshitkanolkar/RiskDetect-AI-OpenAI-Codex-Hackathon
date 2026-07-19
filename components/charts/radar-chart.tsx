"use client";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart as RechartsRadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
export function RadarChart({
  data,
  labelKey,
  valueKey,
}: {
  data: Record<string, string | number>[];
  labelKey: string;
  valueKey: string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsRadarChart data={data}>
        <PolarGrid stroke="hsl(var(--border))" />
        <PolarAngleAxis
          dataKey={labelKey}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
        />
        <Radar
          dataKey={valueKey}
          stroke="hsl(var(--brand))"
          fill="hsl(var(--brand))"
          fillOpacity={0.25}
        />
        <Tooltip
          contentStyle={{
            background: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 8,
          }}
        />
      </RechartsRadarChart>
    </ResponsiveContainer>
  );
}
