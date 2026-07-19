"use client";

import { use } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { PageHeader } from "@/components/common/page-header";
import { useScanDetail } from "@/hooks/use-scans";
import { LoadingState } from "@/components/feedback/loading-state";
import { ErrorState } from "@/components/feedback/error-state";
import { ImageScanResult, UrlScanResult } from "@/components/scans/scan-results";
import { Button } from "@/components/ui/button";

export default function ScanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, isLoading, error, refetch } = useScanDetail(id);

  return (
    <PageShell>
      <PageHeader title="Scan results" description="Detailed risk analysis for this scan." />
      <div className="mt-8">
        {isLoading && <LoadingState label="Loading scan…" />}
        {error && (
          <ErrorState
            title="Could not load scan"
            description={error.message}
            action={
              <Button variant="outline" onClick={() => void refetch()}>
                Retry
              </Button>
            }
          />
        )}
        {data?.scan_type === "url" && <UrlScanResult scan={data} />}
        {data?.scan_type === "image" && <ImageScanResult scan={data} />}
        {!isLoading && !error && !data && (
          <ErrorState
            title="Scan not found"
            description="This scan may have expired in demo memory."
          />
        )}
      </div>
    </PageShell>
  );
}
