"use client";

import {
  Download,
  Expand,
  Eye,
  EyeOff,
  Focus,
  Maximize2,
  Minimize2,
  RotateCcw,
  ScanSearch,
  Tags,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { OverlayMode } from "@/hooks/use-image-viewer";
import { cn } from "@/lib/utils";

interface ViewerToolbarProps {
  scale: number;
  mode: OverlayMode;
  showLabels: boolean;
  privacyBlur: boolean;
  compareMode: "original" | "blurred" | "side-by-side";
  fullscreen: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onFit: () => void;
  onActualSize: () => void;
  onFullscreen: () => void;
  onModeChange: (mode: OverlayMode) => void;
  onToggleLabels: () => void;
  onToggleBlur: () => void;
  onCompareChange: (mode: "original" | "blurred" | "side-by-side") => void;
  onDownloadAnnotated: () => void;
  onDownloadClean: () => void;
  className?: string;
}

function ToolTipButton({
  label,
  onClick,
  children,
  pressed,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  pressed?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant={pressed ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={onClick}
          aria-label={label}
          aria-pressed={pressed}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

export function ViewerToolbar(props: ViewerToolbarProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <div
        className={cn(
          "flex flex-wrap items-center gap-1 rounded-xl border border-border/60 bg-background/80 p-1.5 backdrop-blur",
          props.className,
        )}
        role="toolbar"
        aria-label="Image preview controls"
      >
        <ToolTipButton label="Zoom in" onClick={props.onZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </ToolTipButton>
        <ToolTipButton label="Zoom out" onClick={props.onZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </ToolTipButton>
        <span className="mx-1 min-w-[3rem] text-center font-mono text-xs tabular-nums text-muted-foreground">
          {Math.round(props.scale * 100)}%
        </span>
        <ToolTipButton label="Reset view" onClick={props.onReset}>
          <RotateCcw className="h-4 w-4" />
        </ToolTipButton>
        <ToolTipButton label="Fit to screen" onClick={props.onFit}>
          <Focus className="h-4 w-4" />
        </ToolTipButton>
        <ToolTipButton label="Actual size (100%)" onClick={props.onActualSize}>
          <Expand className="h-4 w-4" />
        </ToolTipButton>
        <ToolTipButton
          label={props.fullscreen ? "Exit fullscreen" : "Fullscreen"}
          onClick={props.onFullscreen}
          pressed={props.fullscreen}
        >
          {props.fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </ToolTipButton>

        <div className="mx-1 h-5 w-px bg-border" aria-hidden />

        <Select value={props.mode} onValueChange={(v) => props.onModeChange(v as OverlayMode)}>
          <SelectTrigger className="h-8 w-[140px] text-xs" aria-label="Overlay mode">
            <ScanSearch className="mr-1.5 h-3.5 w-3.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="boxes">Bounding boxes</SelectItem>
            <SelectItem value="heatmap">Heatmap</SelectItem>
            <SelectItem value="none">None</SelectItem>
          </SelectContent>
        </Select>

        <Toggle
          size="sm"
          pressed={props.showLabels}
          onPressedChange={() => props.onToggleLabels()}
          aria-label="Toggle labels"
          className="h-8 px-2 text-xs"
        >
          <Tags className="mr-1 h-3.5 w-3.5" />
          Labels
        </Toggle>

        <Toggle
          size="sm"
          pressed={props.privacyBlur}
          onPressedChange={() => props.onToggleBlur()}
          aria-label="Hide sensitive data"
          className="h-8 px-2 text-xs"
        >
          {props.privacyBlur ? (
            <EyeOff className="mr-1 h-3.5 w-3.5" />
          ) : (
            <Eye className="mr-1 h-3.5 w-3.5" />
          )}
          Privacy
        </Toggle>

        <Select
          value={props.compareMode}
          onValueChange={(v) => props.onCompareChange(v as "original" | "blurred" | "side-by-side")}
        >
          <SelectTrigger className="h-8 w-[130px] text-xs" aria-label="Compare mode">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="original">Original</SelectItem>
            <SelectItem value="blurred">Blurred</SelectItem>
            <SelectItem value="side-by-side">Side by side</SelectItem>
          </SelectContent>
        </Select>

        <div className="mx-1 h-5 w-px bg-border" aria-hidden />

        <ToolTipButton label="Download annotated image" onClick={props.onDownloadAnnotated}>
          <Download className="h-4 w-4" />
        </ToolTipButton>
        <ToolTipButton label="Download clean image" onClick={props.onDownloadClean}>
          <Download className="h-4 w-4 opacity-70" />
        </ToolTipButton>
      </div>
    </TooltipProvider>
  );
}
