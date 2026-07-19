import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { AppShell } from "@/components/layout/app-shell";
import { isAuthDisabled, isSupabaseConfigured } from "@/lib/env";
import { DEMO_USER } from "@/lib/api/demo-user";
import type { User } from "@supabase/supabase-js";

function demoUser(): User {
  return {
    id: DEMO_USER.id,
    email: DEMO_USER.email,
    app_metadata: {},
    user_metadata: { ...DEMO_USER.user_metadata },
    aud: "authenticated",
    created_at: new Date().toISOString(),
  } as User;
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (isAuthDisabled() || !isSupabaseConfigured()) {
    return <AppShell user={demoUser()}>{children}</AppShell>;
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  return <AppShell user={user}>{children}</AppShell>;
}
