import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase/server";
import { isAuthDisabled, isSupabaseConfigured } from "@/lib/env";
import { DEMO_USER } from "@/lib/api/demo-user";
import { PageShell } from "@/components/layout/page-shell";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const metadata: Metadata = {
  title: "Profile",
};

export default async function ProfilePage() {
  let displayName = DEMO_USER.user_metadata.full_name;
  let email: string | undefined = DEMO_USER.email;
  let avatarUrl: string | undefined;
  let userId = DEMO_USER.id;

  if (!isAuthDisabled() && isSupabaseConfigured()) {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    displayName =
      (user?.user_metadata?.full_name as string | undefined) ??
      user?.email?.split("@")[0] ??
      "User";
    email = user?.email;
    avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
    userId = user?.id ?? DEMO_USER.id;
  }

  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <PageShell className="max-w-3xl">
      <PageHeader title="Profile" description="Your account details and identity." />
      <Card className="mt-8 border-border/60 bg-card/60">
        <CardHeader>
          <CardTitle className="text-card-title">Account</CardTitle>
          <CardDescription>Information associated with your RiskDetect AI account.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="bg-brand/10 text-lg font-semibold text-brand">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-lg font-semibold tracking-tight">{displayName}</p>
            <p className="text-caption">{email}</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">ID: {userId}</p>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
