"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Activity, ImageIcon, Link2, ScanSearch, ShieldAlert, ShieldCheck } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { PageHeader } from "@/components/common/page-header";
import { DashboardGrid } from "@/components/dashboard/dashboard-grid";
import { StatsCard } from "@/components/dashboard/stats-card";
import { RiskCard } from "@/components/dashboard/risk-card";
import { AnalyticsCard } from "@/components/dashboard/analytics-card";
import { RiskTrendChart } from "@/components/charts/risk-trend-chart";
import { PieChart } from "@/components/charts/pie-chart";
import { Widget } from "@/components/dashboard/widget";
import { RiskBadge } from "@/components/common/risk-badge";
import { EmptyState } from "@/components/feedback/empty-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { ErrorState } from "@/components/feedback/error-state";
import { Button } from "@/components/ui/button";
import { Timeline } from "@/components/common/timeline";
import { FadeIn } from "@/components/animations/fade-in";
import { useDashboard } from "@/hooks/use-scans";
import { ROUTES } from "@/constants/routes";

export default function DashboardPage() {
  const { data, isLoading, error, refetch } = useDashboard();

  if (isLoading) {
    return (
      <PageShell>
        <LoadingState label="Loading live risk dashboard…" />
      </PageShell>
    );
  }

  if (error || !data) {
    return (
      <PageShell>
        <ErrorState
          title="Dashboard unavailable"
          description={error?.message ?? "Could not load dashboard data."}
          action={
            <Button variant="outline" onClick={() => void refetch()}>
              Retry
            </Button>
          }
        />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <FadeIn>
        <PageHeader
          title="Digital Risk Dashboard"
          description="Live posture from your URL and screenshot scans."
          actions={
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href={ROUTES.SCAN_URL}>
                  <Link2 className="h-4 w-4" />
                  Scan URL
                </Link>
              </Button>
              <Button variant="brand" asChild>
                <Link href={ROUTES.SCAN_IMAGE}>
                  <ImageIcon className="h-4 w-4" />
                  Scan screenshot
                </Link>
              </Button>
            </div>
          }
        />
      </FadeIn>

      <DashboardGrid className="mt-8">
        <StatsCard
          icon={ShieldCheck}
          label="Risk score"
          value={data.totalScans ? data.riskScore : "—"}
          delta={data.totalScans ? data.riskLevel : "Complete a scan to generate"}
          trend="neutral"
        />
        <StatsCard
          icon={Activity}
          label="Today's scans"
          value={data.todayScans}
          delta={`${data.totalScans} total`}
          trend="neutral"
        />
        <StatsCard
          icon={ShieldAlert}
          label="Recent threats"
          value={data.recentThreats}
          delta="Medium+ findings"
          trend={data.recentThreats > 0 ? "up" : "neutral"}
        />
        <StatsCard
          icon={ScanSearch}
          label="Total scans"
          value={data.totalScans}
          delta="URL + screenshot"
          trend="neutral"
        />
      </DashboardGrid>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <AnalyticsCard
          className="lg:col-span-3"
          title="Risk trend"
          description="Average risk score from your persisted scan history."
        >
          {data.riskTrend.length ? (
            <RiskTrendChart data={data.riskTrend} />
          ) : (
            <EmptyState
              title="No trend yet"
              description="Scan a few URLs or screenshots to populate this chart."
              className="border-0 py-10"
            />
          )}
        </AnalyticsCard>

        <div className="flex flex-col gap-6 lg:col-span-2">
          <RiskCard
            level={data.riskLevel}
            score={data.riskScore}
            description={
              data.totalScans
                ? "Aggregated from your latest scans."
                : "No scans yet — posture will appear after your first analysis."
            }
          />
          <Widget title="Risk distribution">
            {data.riskDistribution.length ? (
              <div className="h-56">
                <PieChart data={data.riskDistribution} nameKey="name" valueKey="value" />
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No distribution yet.</p>
            )}
          </Widget>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Widget title="Recent scans">
          {data.recentScans.length === 0 ? (
            <EmptyState
              icon={ScanSearch}
              title="No activity yet"
              description="Run a URL or screenshot scan to populate your dashboard."
              className="border-0 py-8"
              action={
                <Button variant="brand" asChild>
                  <Link href={ROUTES.SCAN_URL}>Start scanning</Link>
                </Button>
              }
            />
          ) : (
            <ul className="space-y-3">
              {data.recentScans.map((scan) => (
                <li key={scan.id}>
                  <Link
                    href={`${ROUTES.SCAN_DETAIL(scan.id)}?type=${scan.scan_type}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-muted/20 px-3 py-3 transition-colors hover:border-brand/30 hover:bg-brand/5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {scan.scan_type === "url" ? scan.domain : scan.file_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(scan.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <RiskBadge level={scan.risk_level} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Widget>

        <Widget title="Activity timeline">
          {data.activity.length ? (
            <Timeline
              items={data.activity.map((item) => ({
                id: item.id,
                title: item.title,
                description: item.description,
                timestamp: formatDistanceToNow(new Date(item.timestamp), { addSuffix: true }),
                status:
                  item.risk_level === "critical" || item.risk_level === "high"
                    ? "danger"
                    : item.risk_level === "medium"
                      ? "warning"
                      : "success",
              }))}
            />
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No timeline events yet.
            </p>
          )}
        </Widget>
      </div>
    </PageShell>
  );
}
