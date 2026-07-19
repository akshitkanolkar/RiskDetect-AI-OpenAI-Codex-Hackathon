"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { User } from "@supabase/supabase-js";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { SidebarNav } from "@/components/navigation/sidebar-nav";
import { TopBar } from "@/components/navigation/top-bar";
import { CommandMenu } from "@/components/navigation/command-menu";
import { MobileNav } from "./mobile-nav";
import { AppFooter } from "./app-footer";
import { Button } from "@/components/ui/button";

const SecurityCopilot = dynamic(
  () =>
    import("@/components/copilot/security-copilot").then((mod) => ({
      default: mod.SecurityCopilot,
    })),
  { ssr: false },
);

export function AppShell({ children, user }: { children: React.ReactNode; user: User }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="flex h-svh overflow-hidden bg-background">
      <SidebarNav collapsed={collapsed} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex items-center border-b border-border/70">
          <MobileNav />
          <div className="hidden px-3 md:block">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed((value) => !value)}
              aria-label="Toggle sidebar"
            >
              {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
            </Button>
          </div>
          <div className="min-w-0 flex-1">
            <TopBar user={user} />
          </div>
        </div>
        <main className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex-1">{children}</div>
          <AppFooter />
        </main>
      </div>
      <CommandMenu />
      <SecurityCopilot />
    </div>
  );
}
