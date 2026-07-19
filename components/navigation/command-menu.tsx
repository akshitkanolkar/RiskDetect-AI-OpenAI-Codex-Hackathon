"use client";

import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { History, ImageIcon, LayoutDashboard, Link2, Settings, UserRound } from "lucide-react";
import { ROUTES } from "@/constants/routes";

const commands = [
  ["Dashboard", ROUTES.DASHBOARD, LayoutDashboard],
  ["URL Scanner", ROUTES.SCAN_URL, Link2],
  ["Screenshot Scan", ROUTES.SCAN_IMAGE, ImageIcon],
  ["History", ROUTES.SCANS, History],
  ["Settings", ROUTES.SETTINGS, Settings],
  ["Profile", ROUTES.PROFILE, UserRound],
] as const;

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);
  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Navigate RiskDetect AI"
      className="fixed inset-0 z-command flex items-start justify-center bg-background/60 p-4 pt-[15vh] backdrop-blur-sm"
    >
      <div className="w-full max-w-xl overflow-hidden rounded-xl border border-border bg-popover shadow-modal">
        <Command.Input
          autoFocus
          placeholder="Search pages…"
          className="h-12 w-full border-b border-border bg-transparent px-4 text-sm outline-none placeholder:text-muted-foreground"
        />
        <Command.List className="max-h-80 overflow-y-auto p-2">
          <Command.Empty className="p-6 text-center text-sm text-muted-foreground">
            No matching pages.
          </Command.Empty>
          <Command.Group heading="Navigation" className="text-xs text-muted-foreground">
            {commands.map(([label, href, Icon]) => (
              <Command.Item
                key={href}
                value={label}
                onSelect={() => {
                  router.push(href);
                  setOpen(false);
                }}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground aria-selected:bg-accent"
              >
                <Icon className="h-4 w-4 text-brand" />
                {label}
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>
      </div>
    </Command.Dialog>
  );
}
