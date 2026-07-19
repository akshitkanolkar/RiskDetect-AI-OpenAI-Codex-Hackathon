"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { SidebarNav } from "@/components/navigation/sidebar-nav";
import { TopBar } from "@/components/navigation/top-bar";
import { CommandMenu } from "@/components/navigation/command-menu";
import { MobileNav } from "./mobile-nav";
import { Button } from "@/components/ui/button";
import { SecurityCopilot } from "@/components/copilot/security-copilot";

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
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
      <CommandMenu />
      <SecurityCopilot />
    </div>
  );
}
