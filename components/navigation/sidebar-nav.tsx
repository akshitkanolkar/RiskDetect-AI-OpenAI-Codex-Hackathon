"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Link2, ImageIcon, History, Settings, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { Logo } from "@/components/shared/logo";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const NAV_ITEMS = [
  { href: ROUTES.DASHBOARD, label: "Dashboard", icon: LayoutDashboard },
  { href: ROUTES.SCAN_URL, label: "URL Scanner", icon: Link2 },
  { href: ROUTES.SCAN_IMAGE, label: "Screenshot Scan", icon: ImageIcon },
  { href: ROUTES.SCANS, label: "History", icon: History },
  { href: ROUTES.SETTINGS, label: "Settings", icon: Settings },
  { href: ROUTES.PROFILE, label: "Profile", icon: User },
] as const;

export function SidebarNav({
  collapsed = false,
  onNavigate,
  mobile = false,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
  mobile?: boolean;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "shrink-0 flex-col border-r border-border/70 bg-surface/60 transition-[width] duration-200",
        mobile ? "flex w-full border-0" : "hidden md:flex",
        collapsed ? "w-[4.5rem]" : "w-64",
      )}
    >
      <div
        className={cn(
          "flex h-16 items-center border-b border-border/70",
          collapsed ? "justify-center px-2" : "px-5",
        )}
      >
        <Logo showText={!collapsed} />
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === ROUTES.SCANS
              ? pathname === ROUTES.SCANS
              : pathname === href || pathname.startsWith(`${href}/`);
          const link = (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                collapsed && "justify-center px-2",
                isActive
                  ? "bg-brand/10 text-brand"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              onClick={onNavigate}
            >
              <Icon className="h-4 w-4" />
              {!collapsed && label}
            </Link>
          );
          return collapsed ? (
            <Tooltip key={href}>
              <TooltipTrigger asChild>{link}</TooltipTrigger>
              <TooltipContent side="right">{label}</TooltipContent>
            </Tooltip>
          ) : (
            <span key={href}>{link}</span>
          );
        })}
      </nav>
    </aside>
  );
}
