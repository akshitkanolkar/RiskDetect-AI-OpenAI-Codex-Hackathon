import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { PageHeader } from "@/components/common/page-header";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  return (
    <PageShell className="max-w-3xl">
      <PageHeader title="Settings" description="Manage appearance and account preferences." />
      <Card className="mt-8 border-border/60 bg-card/60">
        <CardHeader>
          <CardTitle className="text-card-title">Appearance</CardTitle>
          <CardDescription>Switch between light, dark, and system themes.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="text-label">Theme</p>
            <p className="text-caption">Toggle the application color scheme</p>
          </div>
          <ThemeToggle />
        </CardContent>
      </Card>
    </PageShell>
  );
}
