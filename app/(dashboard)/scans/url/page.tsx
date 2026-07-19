import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { PageHeader } from "@/components/common/page-header";
import { UrlScanForm } from "@/components/scans/url-scan-form";

export const metadata: Metadata = {
  title: "URL Risk Scanner",
};

export default function UrlScanPage() {
  return (
    <PageShell className="max-w-3xl">
      <PageHeader
        title="AI URL Risk Scanner"
        description="Paste any link to detect phishing patterns, suspicious structure, and known malicious indicators."
      />
      <div className="mt-8">
        <UrlScanForm />
      </div>
    </PageShell>
  );
}
