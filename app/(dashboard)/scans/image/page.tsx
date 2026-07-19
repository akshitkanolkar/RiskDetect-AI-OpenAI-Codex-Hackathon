import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { PageHeader } from "@/components/common/page-header";
import { ImageScanUploader } from "@/components/scans/image-scan-uploader";

export const metadata: Metadata = {
  title: "Screenshot Privacy Scanner",
};

export default function ImageScanPage() {
  return (
    <PageShell className="max-w-3xl">
      <PageHeader
        title="AI Screenshot Privacy Scanner"
        description="Upload a screenshot to OCR sensitive data like emails, IDs, secrets, and payment handles."
      />
      <div className="mt-8">
        <ImageScanUploader />
      </div>
    </PageShell>
  );
}
