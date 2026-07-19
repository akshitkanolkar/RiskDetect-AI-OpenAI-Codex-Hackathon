"use client";

import type { User } from "@supabase/supabase-js";
import { Search } from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { NotificationsPanel } from "./notifications-panel";
import { UserMenu } from "./user-menu";

interface TopBarProps {
  user: User;
}

export function TopBar({ user }: TopBarProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border/70 bg-background/70 px-4 backdrop-blur-xl md:px-6">
      <Button
        variant="ghost"
        className="hidden h-9 w-full max-w-sm justify-start rounded-lg border border-border/70 bg-surface/60 px-3 text-muted-foreground md:flex"
        onClick={() =>
          document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))
        }
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search or jump to…</span>
        <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px]">⌘K</kbd>
      </Button>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <NotificationsPanel />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
