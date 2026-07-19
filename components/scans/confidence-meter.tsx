"use client";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function ConfidenceMeter({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Confidence</span>
        <span className="font-medium text-foreground">{value}%</span>
      </div>
      <Progress value={value} className="h-2" />
    </div>
  );
}
