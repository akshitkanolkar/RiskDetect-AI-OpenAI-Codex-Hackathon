import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export const DEMO_USER_ID = "00000000-0000-4000-8000-000000000001";

export async function requireUser() {
  if (!isSupabaseConfigured()) {
    return {
      id: DEMO_USER_ID,
      email: "demo@riskdetect.ai",
      user_metadata: { full_name: "Demo User" },
    };
  }

  const supabase = await createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}
