"use client";

import { useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { DEMO_USER } from "@/lib/api/demo-user";
import { isAuthDisabled, isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/stores/auth-store";

function demoAuthUser(): User {
  return {
    id: DEMO_USER.id,
    email: DEMO_USER.email,
    app_metadata: {},
    user_metadata: { ...DEMO_USER.user_metadata },
    aud: "authenticated",
    created_at: new Date().toISOString(),
  } as User;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);
  const reset = useAuthStore((state) => state.reset);

  useEffect(() => {
    if (isAuthDisabled() || !isSupabaseConfigured()) {
      setUser(demoAuthUser());
      return;
    }

    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        reset();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setLoading, reset]);

  return <>{children}</>;
}
