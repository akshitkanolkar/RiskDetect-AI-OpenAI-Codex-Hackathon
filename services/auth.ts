import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";
import { ROUTES } from "@/constants/routes";
import type { SignInInput, SignUpInput } from "@/lib/validations/auth";

export const authService = {
  async signIn({ email, password }: SignInInput) {
    if (!isSupabaseConfigured()) {
      return {
        data: null,
        error: { message: "Supabase is not configured. Add credentials to .env.local." },
      };
    }

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { data: null, error: { message: error.message } };
    }

    return { data: { user: data.user, session: data.session }, error: null };
  },

  async signUp({ email, password, fullName }: SignUpInput) {
    if (!isSupabaseConfigured()) {
      return {
        data: null,
        error: { message: "Supabase is not configured. Add credentials to .env.local." },
      };
    }

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}${ROUTES.AUTH_CALLBACK}`,
      },
    });

    if (error) {
      return { data: null, error: { message: error.message } };
    }

    return { data: { user: data.user, session: data.session }, error: null };
  },

  async signOut() {
    if (!isSupabaseConfigured()) {
      return { error: null };
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    return { error: error ? { message: error.message } : null };
  },

  async getSession() {
    if (!isSupabaseConfigured()) {
      return { data: { session: null }, error: null };
    }

    const supabase = createClient();
    return supabase.auth.getSession();
  },

  async getUser() {
    if (!isSupabaseConfigured()) {
      return { data: { user: null }, error: null };
    }

    const supabase = createClient();
    return supabase.auth.getUser();
  },

  async resetPassword(email: string) {
    if (!isSupabaseConfigured()) {
      return {
        data: null,
        error: { message: "Supabase is not configured. Add credentials to .env.local." },
      };
    }

    const supabase = createClient();
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      return { data: null, error: { message: error.message } };
    }

    return { data, error: null };
  },
};
