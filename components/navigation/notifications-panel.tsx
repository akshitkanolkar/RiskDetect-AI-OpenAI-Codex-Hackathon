"use client";

import { BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@radix-ui/react-popover";

export function NotificationsPanel() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-lg"
          aria-label="Open notifications"
        >
          <span className="sr-only">Notifications</span>
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
          </svg>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="z-50 w-80 rounded-xl border border-border bg-popover p-4 shadow-floating"
      >
        <div className="mb-5 flex items-center justify-between">
          <p className="font-semibold">Notifications</p>
          <span className="text-xs text-muted-foreground">All caught up</span>
        </div>
        <div className="flex flex-col items-center py-7 text-center">
          <BellOff className="mb-3 h-5 w-5 text-muted-foreground" />
          <p className="text-sm font-medium">No notifications yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Updates about your security activity will appear here.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
