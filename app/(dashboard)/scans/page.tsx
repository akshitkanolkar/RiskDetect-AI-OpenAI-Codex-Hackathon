"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ImageIcon, Link2 } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { PageHeader } from "@/components/common/page-header";
import { useHistory } from "@/hooks/use-scans";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { RiskBadge } from "@/components/common/risk-badge";
import { EmptyState } from "@/components/feedback/empty-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { ErrorState } from "@/components/feedback/error-state";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import type { UnifiedScan } from "@/types/scans";

type HistoryRow = {
  id: string;
  target: string;
  type: string;
  risk: UnifiedScan["risk_level"];
  score: number;
  when: string;
  href: string;
};

export default function HistoryPage() {
  const { data, isLoading, error, refetch } = useHistory("all");

  const rows: HistoryRow[] =
    data?.map((scan) => ({
      id: scan.id,
      target: scan.scan_type === "url" ? scan.normalized_url : scan.file_name,
      type: scan.scan_type,
      risk: scan.risk_level,
      score: scan.risk_score,
      when: format(new Date(scan.created_at), "MMM d, HH:mm"),
      href: `${ROUTES.SCAN_DETAIL(scan.id)}?type=${scan.scan_type}`,
    })) ?? [];

  const columns: DataTableColumn<HistoryRow>[] = [
    {
      key: "target",
      header: "Target",
      sortable: true,
      render: (row) => (
        <Link href={row.href} className="font-medium text-foreground hover:text-brand">
          <span className="line-clamp-1 max-w-[280px]">{row.target}</span>
        </Link>
      ),
    },
    {
      key: "type",
      header: "Type",
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 capitalize text-muted-foreground">
          {row.type === "url" ? (
            <Link2 className="h-3.5 w-3.5" />
          ) : (
            <ImageIcon className="h-3.5 w-3.5" />
          )}
          {row.type}
        </span>
      ),
    },
    {
      key: "risk",
      header: "Risk",
      sortable: true,
      render: (row) => <RiskBadge level={row.risk} />,
    },
    {
      key: "score",
      header: "Score",
      sortable: true,
      render: (row) => <span className="font-mono text-sm">{row.score}</span>,
    },
    {
      key: "when",
      header: "When",
      sortable: true,
    },
  ];

  return (
    <PageShell>
      <PageHeader
        title="Scan history"
        description="Persisted URL and screenshot scans for your account."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={ROUTES.SCAN_URL}>Scan URL</Link>
            </Button>
            <Button variant="brand" asChild>
              <Link href={ROUTES.SCAN_IMAGE}>Scan screenshot</Link>
            </Button>
          </div>
        }
      />

      <div className="mt-8">
        {isLoading && <LoadingState label="Loading history…" />}
        {error && (
          <ErrorState
            title="Could not load history"
            description={error.message}
            action={
              <Button variant="outline" onClick={() => void refetch()}>
                Retry
              </Button>
            }
          />
        )}
        {!isLoading && !error && rows.length === 0 && (
          <EmptyState
            title="No scans yet"
            description="Run a URL or screenshot scan to start building your risk history."
            action={
              <Button variant="brand" asChild>
                <Link href={ROUTES.SCAN_URL}>Scan your first URL</Link>
              </Button>
            }
          />
        )}
        {!isLoading && !error && rows.length > 0 && (
          <DataTable columns={columns} data={rows} searchKeys={["target", "type", "risk"]} />
        )}
      </div>
    </PageShell>
  );
}
