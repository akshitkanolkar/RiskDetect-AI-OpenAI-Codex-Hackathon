"use client";

import { useMemo, useRef } from "react";
import type { ImageFinding } from "@/types/scans";
import { ViewerFindingCard } from "@/components/scans/viewer/viewer-finding-card";
import { EmptyState } from "@/components/feedback/empty-state";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface FindingListProps {
  findings: ImageFinding[];
  selectedId: string | null;
  ignoredIds: Set<string>;
  privacyBlur: boolean;
  onLocate: (id: string) => void;
  onIgnore: (id: string) => void;
  className?: string;
}

export function FindingList({
  findings,
  selectedId,
  ignoredIds,
  privacyBlur,
  onLocate,
  onIgnore,
  className,
}: FindingListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const visible = useMemo(
    () => findings.filter((f) => !ignoredIds.has(f.id)),
    [findings, ignoredIds],
  );

  if (!visible.length) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="No findings to inspect"
        description="Nothing sensitive was validated in this screenshot."
        className={className}
      />
    );
  }

  return (
    <div
      ref={listRef}
      className={cn("space-y-3 overflow-y-auto pr-1", className)}
      role="listbox"
      aria-label="Detected findings"
    >
      {visible.map((finding) => (
        <ViewerFindingCard
          key={finding.id}
          finding={finding}
          selected={selectedId === finding.id}
          onLocate={onLocate}
          onIgnore={onIgnore}
          privacyBlur={privacyBlur}
        />
      ))}
    </div>
  );
}
