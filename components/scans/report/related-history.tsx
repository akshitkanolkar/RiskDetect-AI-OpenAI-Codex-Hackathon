"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ArrowRight, History, ImageIcon, Link2 } from "lucide-react";
import { useHistory } from "@/hooks/use-scans";
import { RiskBadge } from "@/components/common/risk-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

export function RelatedHistory({
  currentId,
  className,
}: {
  currentId: string;
  className?: string;
}) {
  const { data, isLoading } = useHistory("all");
  const recent = (data ?? []).filter((s) => s.id !== currentId).slice(0, 5);

  return (
    <section className={cn("glass-panel rounded-2xl p-6", className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-brand" aria-hidden />
          <h2 className="text-card-title">Recent history</h2>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href={ROUTES.SCANS}>
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && recent.length === 0 && (
        <p className="text-sm text-muted-foreground">No other scans in history yet.</p>
      )}

      {!isLoading && recent.length > 0 && (
        <ul className="space-y-2">
          {recent.map((scan) => {
            const href = `${ROUTES.SCAN_DETAIL(scan.id)}?type=${scan.scan_type}`;
            const target = scan.scan_type === "url" ? scan.normalized_url : scan.file_name;
            return (
              <li key={scan.id}>
                <Link
                  href={href}
                  className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/40 px-3 py-2.5 transition-colors hover:border-brand/40 hover:bg-brand/5"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    {scan.scan_type === "url" ? (
                      <Link2 className="h-4 w-4" aria-hidden />
                    ) : (
                      <ImageIcon className="h-4 w-4" aria-hidden />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1 text-sm font-medium">{target}</span>
                    <span className="block text-xs text-muted-foreground">
                      {format(new Date(scan.created_at), "MMM d · HH:mm")}
                    </span>
                  </span>
                  <RiskBadge level={scan.risk_level} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
