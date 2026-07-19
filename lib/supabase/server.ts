import { createServerClient as createSSRServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isSupabaseConfigured } from "@/lib/env";

export async function createServerClient() {
  if (!isSupabaseConfigured()) {
    return createMockServerClient();
  }

  const cookieStore = await cookies();

  return createSSRServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll can fail in Server Components where cookies are read-only.
            // Middleware will refresh sessions instead.
          }
        },
      },
    },
  );
}

function createMockServerClient() {
  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      signOut: async () => ({ error: null }),
      exchangeCodeForSession: async () => ({
        data: { session: null, user: null },
        error: { message: "Supabase is not configured", name: "AuthError", status: 500 },
      }),
    },
  } as unknown as ReturnType<typeof createSSRServerClient>;
}
