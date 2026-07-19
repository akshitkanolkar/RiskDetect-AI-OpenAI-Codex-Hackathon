"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ListFilter } from "lucide-react";
import type { ImageFinding, ImageScanRecord } from "@/types/scans";
import { dedupeFindings } from "@/lib/report/finding-meta";
import {
  centerOffset,
  downloadDataUrl,
  fitScale,
  viewportInImageSpace,
  type Point,
  type Size,
} from "@/lib/viewer/image-transforms";
import { readScanPreview } from "@/lib/viewer/preview-cache";
import { useOverlay, usePan, useSelection, useZoom } from "@/hooks/use-image-viewer";
import { DetectionOverlay } from "@/components/scans/viewer/detection-overlay";
import { ViewerToolbar } from "@/components/scans/viewer/viewer-toolbar";
import { MiniMap } from "@/components/scans/viewer/mini-map";
import { SeverityLegend } from "@/components/scans/viewer/severity-legend";
import { FindingList } from "@/components/scans/viewer/finding-list";
import { ImageStageTimeline } from "@/components/scans/viewer/image-stage-timeline";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ImageViewerProps {
  scan: ImageScanRecord;
  className?: string;
}

export function ImageViewer({ scan, className }: ImageViewerProps) {
  const { toast } = useToast();
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const findings = useMemo(() => dedupeFindings(scan.findings), [scan.findings]);
  const imageSrc = scan.image_data_url || readScanPreview(scan.id) || "";

  const [natural, setNatural] = useState<Size>({
    width: scan.image_width ?? 0,
    height: scan.image_height ?? 0,
  });
  const [container, setContainer] = useState<Size>({ width: 0, height: 0 });
  const [fullscreen, setFullscreen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [ready, setReady] = useState(false);

  const { scale, setZoom, zoomIn, zoomOut } = useZoom(1);
  const { offset, setOffset, onPointerDown, onPointerMove, onPointerUp, resetPan } = usePan();
  const scaleRef = useRef(scale);
  const offsetRef = useRef(offset);
  scaleRef.current = scale;
  offsetRef.current = offset;
  const {
    mode,
    setMode,
    showLabels,
    setShowLabels,
    privacyBlur,
    setPrivacyBlur,
    compareMode,
    setCompareMode,
  } = useOverlay();
  const { selectedId, hoveredId, setHoveredId, select, ignore, ignoredIds } = useSelection();

  // Measure stage
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainer({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fitToScreen = useCallback(() => {
    if (!natural.width || !container.width) return;
    const next = fitScale(container, natural);
    setZoom(next);
    setOffset(centerOffset(container, natural, next));
  }, [natural, container, setZoom, setOffset]);

  useEffect(() => {
    if (ready && natural.width && container.width) {
      fitToScreen();
    }
  }, [ready, natural.width, container.width]); // eslint-disable-line react-hooks/exhaustive-deps

  const focusFinding = useCallback(
    (id: string) => {
      const finding = findings.find((f) => f.id === id);
      select(id);
      setMobileOpen(true);
      if (!finding?.bbox || !natural.width) return;

      const targetScale = Math.min(
        2.4,
        Math.max(1.2, (container.width * 0.45) / Math.max(finding.bbox.width, 1)),
      );
      setZoom(targetScale);
      const cx = finding.bbox.x + finding.bbox.width / 2;
      const cy = finding.bbox.y + finding.bbox.height / 2;
      setOffset({
        x: container.width / 2 - cx * targetScale,
        y: container.height / 2 - cy * targetScale,
      });
    },
    [findings, select, natural.width, container, setZoom, setOffset],
  );

  // Keyboard
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (fullscreen) void document.exitFullscreen?.();
        select(null);
        return;
      }
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      const boxed = findings.filter((f) => f.bbox && !ignoredIds.has(f.id));
      const idx = boxed.findIndex((f) => f.id === selectedId);
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        const next = boxed[(idx + 1 + boxed.length) % Math.max(boxed.length, 1)];
        if (next) focusFinding(next.id);
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        const next = boxed[(idx - 1 + boxed.length) % Math.max(boxed.length, 1)];
        if (next) focusFinding(next.id);
      }
      if (e.key === "+" || e.key === "=") zoomIn();
      if (e.key === "-" || e.key === "_") zoomOut();
      if (e.key === "0") fitToScreen();
      if (e.key === "Enter" && selectedId) focusFinding(selectedId);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    findings,
    selectedId,
    ignoredIds,
    fullscreen,
    focusFinding,
    select,
    zoomIn,
    zoomOut,
    fitToScreen,
  ]);

  useEffect(() => {
    function onFs() {
      setFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  // Non-passive wheel listener so we can prevent page scroll while zooming
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const currentScale = scaleRef.current;
      const currentOffset = offsetRef.current;
      const delta = e.deltaY > 0 ? -0.12 : 0.12;
      const next = Math.min(6, Math.max(0.25, currentScale + delta));
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const ratio = next / currentScale;
      setOffset({
        x: mx - (mx - currentOffset.x) * ratio,
        y: my - (my - currentOffset.y) * ratio,
      });
      setZoom(next);
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [setOffset, setZoom]);

  // Pinch zoom
  const pinchRef = useRef<{ dist: number; scale: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = { dist: Math.hypot(dx, dy), scale };
    } else if (e.touches.length === 1) {
      onPointerDown(e.touches[0].clientX, e.touches[0].clientY);
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      setZoom(pinchRef.current.scale * (dist / pinchRef.current.dist));
    } else if (e.touches.length === 1) {
      onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const viewport = useMemo(
    () => viewportInImageSpace(container, natural, scale, offset),
    [container, natural, scale, offset],
  );

  const hoveredFinding = useMemo(
    () => findings.find((f) => f.id === hoveredId) ?? null,
    [findings, hoveredId],
  );

  async function toggleFullscreen() {
    const el = rootRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) await el.requestFullscreen();
      else await document.exitFullscreen();
    } catch {
      toast({ title: "Fullscreen unavailable", variant: "destructive" });
    }
  }

  function downloadClean() {
    if (!imageSrc) {
      toast({ title: "Image unavailable", variant: "destructive" });
      return;
    }
    downloadDataUrl(imageSrc, scan.file_name || "safelens-original.png");
  }

  async function downloadAnnotated() {
    if (!imageSrc || !natural.width) {
      toast({ title: "Image unavailable", variant: "destructive" });
      return;
    }
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("load failed"));
        img.src = imageSrc;
      });
      const canvas = document.createElement("canvas");
      canvas.width = natural.width;
      canvas.height = natural.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas");
      ctx.drawImage(img, 0, 0);
      for (const f of findings) {
        if (!f.bbox || ignoredIds.has(f.id)) continue;
        const colors: Record<string, string> = {
          critical: "#ef4444",
          high: "#f97316",
          medium: "#eab308",
          low: "#38bdf8",
          safe: "#22c55e",
        };
        ctx.strokeStyle = colors[f.risk_level] ?? "#22d3ee";
        ctx.lineWidth = Math.max(2, natural.width / 400);
        ctx.strokeRect(f.bbox.x, f.bbox.y, f.bbox.width, f.bbox.height);
        ctx.fillStyle = colors[f.risk_level] ?? "#22d3ee";
        ctx.font = `${Math.max(12, natural.width / 80)}px sans-serif`;
        ctx.fillText(f.label, f.bbox.x, Math.max(14, f.bbox.y - 4));
      }
      downloadDataUrl(
        canvas.toDataURL("image/png"),
        `safelens-annotated-${scan.file_name || "scan"}.png`,
      );
    } catch {
      toast({ title: "Could not export annotated image", variant: "destructive" });
    }
  }

  const renderStage = (blur: boolean, sideBySide = false) => (
    <div
      className={cn("relative h-full min-h-[320px] w-full overflow-hidden", sideBySide && "w-1/2")}
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest("[data-bbox]")) return;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        onPointerDown(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => onPointerMove(e.clientX, e.clientY)}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onPointerUp}
      style={{ touchAction: "none", cursor: "grab" }}
    >
      <motion.div
        className="absolute left-0 top-0 origin-top-left will-change-transform"
        style={{
          width: natural.width || undefined,
          height: natural.height || undefined,
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
        }}
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: ready ? 1 : 0 }}
        transition={{ duration: 0.45 }}
      >
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={sideBySide ? undefined : imgRef}
            src={imageSrc}
            alt={`Screenshot ${scan.file_name}`}
            className="block max-w-none select-none"
            style={{
              width: natural.width || "auto",
              height: natural.height || "auto",
              imageRendering: scale > 1.5 ? "auto" : "auto",
            }}
            draggable={false}
            onLoad={(e) => {
              const el = e.currentTarget;
              setNatural({
                width: el.naturalWidth,
                height: el.naturalHeight,
              });
              setReady(true);
            }}
          />
        ) : (
          <div className="flex h-[320px] w-full items-center justify-center bg-muted/40 text-sm text-muted-foreground">
            Preview unavailable — re-scan to capture the screenshot.
          </div>
        )}

        {imageSrc && natural.width > 0 && (
          <DetectionOverlay
            findings={findings}
            imageWidth={natural.width}
            imageHeight={natural.height}
            mode={mode}
            showLabels={showLabels && !sideBySide}
            privacyBlur={blur}
            selectedId={selectedId}
            hoveredId={hoveredId}
            ignoredIds={ignoredIds}
            onSelect={focusFinding}
            onHover={setHoveredId}
          />
        )}
      </motion.div>
    </div>
  );

  const findingsPanel = (
    <FindingList
      findings={findings}
      selectedId={selectedId}
      ignoredIds={ignoredIds}
      privacyBlur={privacyBlur}
      onLocate={focusFinding}
      onIgnore={ignore}
      className="max-h-[min(70vh,720px)]"
    />
  );

  return (
    <section
      ref={rootRef}
      className={cn(
        "overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-surface via-surface-elevated to-surface shadow-glass",
        fullscreen && "fixed inset-0 z-modal rounded-none",
        className,
      )}
      aria-label="Interactive detection preview"
    >
      <div className="space-y-3 border-b border-border/50 p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-card-title">Interactive image inspection</h2>
            <p className="text-xs text-muted-foreground">
              Click a region or finding to synchronize focus · scroll/pinch to zoom · drag to pan
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <ListFilter className="h-4 w-4" />
            Findings ({findings.filter((f) => !ignoredIds.has(f.id)).length})
          </Button>
        </div>
        <ViewerToolbar
          scale={scale}
          mode={mode}
          showLabels={showLabels}
          privacyBlur={privacyBlur}
          compareMode={compareMode}
          fullscreen={fullscreen}
          onZoomIn={() => zoomIn()}
          onZoomOut={() => zoomOut()}
          onReset={() => {
            resetPan();
            fitToScreen();
          }}
          onFit={fitToScreen}
          onActualSize={() => {
            setZoom(1);
            setOffset(centerOffset(container, natural, 1));
          }}
          onFullscreen={() => void toggleFullscreen()}
          onModeChange={setMode}
          onToggleLabels={() => setShowLabels((v) => !v)}
          onToggleBlur={() => setPrivacyBlur((v) => !v)}
          onCompareChange={setCompareMode}
          onDownloadAnnotated={() => void downloadAnnotated()}
          onDownloadClean={downloadClean}
        />
        <div className="flex flex-wrap items-center gap-2">
          <SeverityLegend />
          <ImageStageTimeline className="hidden xl:flex" />
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.9fr)]">
        <div
          ref={stageRef}
          className="relative min-h-[360px] bg-[radial-gradient(ellipse_at_center,hsl(var(--brand)/0.06),transparent_60%),hsl(var(--muted)/0.25)] lg:min-h-[560px]"
        >
          {compareMode === "side-by-side" ? (
            <div className="flex h-full">
              {renderStage(false, true)}
              {renderStage(true, true)}
            </div>
          ) : (
            renderStage(compareMode === "blurred" || privacyBlur)
          )}

          <MiniMap
            imageSrc={imageSrc}
            image={natural}
            viewport={viewport}
            scale={scale}
            container={container}
            onNavigate={(p: Point) => setOffset(p)}
          />

          {hoveredFinding && (
            <div className="pointer-events-none absolute left-3 top-3 z-30 max-w-xs rounded-xl border border-border/70 bg-popover/95 p-3 text-sm shadow-dropdown backdrop-blur">
              <p className="font-semibold">{hoveredFinding.label}</p>
              <p className="mt-1 break-all font-mono text-xs text-brand">
                {privacyBlur ? "████████" : hoveredFinding.value}
              </p>
              <p className="mt-1 text-xs capitalize text-muted-foreground">
                {hoveredFinding.risk_level} risk
                {(hoveredFinding.confidence ?? 0) > 0
                  ? ` · ${hoveredFinding.confidence}% confidence`
                  : ""}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{hoveredFinding.recommendation}</p>
            </div>
          )}
        </div>

        <aside className="hidden border-l border-border/50 bg-background/40 p-3 lg:block">
          <p className="text-label mb-3 text-muted-foreground">Detected findings</p>
          {findingsPanel}
        </aside>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent className="px-3 pb-6">
          <SheetHeader>
            <SheetTitle>Detected findings</SheetTitle>
          </SheetHeader>
          <div className="mt-3 max-h-[70vh] overflow-y-auto">{findingsPanel}</div>
        </SheetContent>
      </Sheet>

      <AnimatePresence>
        {selectedId && (
          <motion.div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-brand to-transparent lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

/** Re-export finding type helper for overlays */
export type { ImageFinding };
