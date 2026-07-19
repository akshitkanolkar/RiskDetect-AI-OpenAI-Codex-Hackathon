import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { AuthShell } from "@/components/layout/auth-shell";

export const metadata: Metadata = {
  title: {
    template: "%s | SafeLens AI",
    default: "Authentication",
  },
};

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(ROUTES.DASHBOARD);
  }

  return <AuthShell>{children}</AuthShell>;
}
