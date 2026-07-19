"use client";

import { cn } from "@/lib/utils";
export function ChartContainer({
  title,
  description,
  children,
  className,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("glass-panel rounded-xl p-5", className)}>
      {(title || description) && (
        <header className="mb-5">
          <h2 className="font-semibold">{title}</h2>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </header>
      )}
      <div className="h-72 w-full">{children}</div>
    </section>
  );
}
