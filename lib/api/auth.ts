import { createServerClient } from "@/lib/supabase/server";
import { isAuthDisabled, isSupabaseConfigured } from "@/lib/env";
import { DEMO_USER } from "@/lib/api/demo-user";

export { DEMO_USER, DEMO_USER_ID } from "@/lib/api/demo-user";

export async function requireUser() {
  if (isAuthDisabled() || !isSupabaseConfigured()) {
    return { ...DEMO_USER };
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
