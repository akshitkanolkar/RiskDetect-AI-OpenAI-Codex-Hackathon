"use client";

import { create } from "zustand";
import type { AuthUser } from "@/types/auth";
import type { UserProfile } from "@/types";

interface AuthStore {
  user: AuthUser | null;
  profile: UserProfile | null;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (isLoading: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  profile: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set({ user: null, profile: null, isLoading: false }),
}));
