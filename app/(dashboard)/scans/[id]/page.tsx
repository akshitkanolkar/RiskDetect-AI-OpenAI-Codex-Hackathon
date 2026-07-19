"use client";

import { use } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { PageHeader } from "@/components/common/page-header";
import { useScanDetail } from "@/hooks/use-scans";
import { ErrorState } from "@/components/feedback/error-state";
import { ImageScanResult, UrlScanResult } from "@/components/scans/scan-results";
import { ReportSkeleton } from "@/components/scans/report/report-skeleton";
import { Button } from "@/components/ui/button";

export default function ScanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading, error, refetch } = useScanDetail(id);

  return (
    <PageShell>
      <PageHeader
        title="Security Intelligence Report"
        description="AI-powered analysis of detections, exposure, and recommended actions."
      />
      <div className="mt-8">
        {isLoading && <ReportSkeleton />}
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
