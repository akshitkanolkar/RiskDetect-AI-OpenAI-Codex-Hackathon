"use client";

import { RadarChart } from "@/components/charts/radar-chart";
import type { PrivacyExposure } from "@/lib/report/derive-intelligence";
import { cn } from "@/lib/utils";

export function PrivacyScorePanel({
  privacy,
  className,
}: {
  privacy: PrivacyExposure;
  className?: string;
}) {
  const axes = [
    { label: "Identity", value: privacy.identity },
    { label: "Financial", value: privacy.financial },
    { label: "Credentials", value: privacy.credentials },
    { label: "Communication", value: privacy.communication },
  ];

  return (
    <section className={cn("glass-panel rounded-2xl p-6", className)}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-card-title">Privacy exposure score</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Multi-axis view of how much personal surface area this scan reveals.
          </p>
        </div>
        <div className="text-right">
          <p className="text-label text-muted-foreground">Overall</p>
          <p className="font-mono text-3xl font-bold tabular-nums text-brand">{privacy.overall}%</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_220px]">
        <div className="h-72 w-full">
          <RadarChart data={axes} labelKey="label" valueKey="value" />
        </div>
        <ul className="space-y-3 self-center">
          {axes.map((axis) => (
            <li key={axis.label}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{axis.label}</span>
                <span className="font-mono tabular-nums">{axis.value}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-brand transition-all duration-700"
                  style={{ width: `${axis.value}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
