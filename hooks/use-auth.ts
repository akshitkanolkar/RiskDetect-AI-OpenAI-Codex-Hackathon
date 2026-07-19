"use client";

import { useAuthStore } from "@/lib/stores/auth-store";
import { authService } from "@/services/auth";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { isAuthDisabled } from "@/lib/env";

export function useAuth() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const isLoading = useAuthStore((state) => state.isLoading);
  const reset = useAuthStore((state) => state.reset);

  const signOut = async () => {
    if (isAuthDisabled()) {
      router.push(ROUTES.DASHBOARD);
      return;
    }
    await authService.signOut();
    reset();
    router.push(ROUTES.LOGIN);
    router.refresh();
  };

  return {
    user,
    profile,
    isLoading,
    isAuthenticated: Boolean(user),
    signOut,
  };
}
