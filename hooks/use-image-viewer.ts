"use client";

import { useCallback, useRef, useState } from "react";
import { clamp } from "@/lib/viewer/image-transforms";

const MIN_SCALE = 0.25;
const MAX_SCALE = 6;

export function useZoom(initial = 1) {
  const [scale, setScale] = useState(initial);

  const zoomIn = useCallback((step = 0.2) => {
    setScale((s) => clamp(Number((s + step).toFixed(3)), MIN_SCALE, MAX_SCALE));
  }, []);

  const zoomOut = useCallback((step = 0.2) => {
    setScale((s) => clamp(Number((s - step).toFixed(3)), MIN_SCALE, MAX_SCALE));
  }, []);

  const setZoom = useCallback((next: number) => {
    setScale(clamp(Number(next.toFixed(3)), MIN_SCALE, MAX_SCALE));
  }, []);

  const zoomAt = useCallback((next: number) => {
    setScale(clamp(Number(next.toFixed(3)), MIN_SCALE, MAX_SCALE));
  }, []);

  return {
    scale,
    setZoom,
    zoomIn,
    zoomOut,
    zoomAt,
    minScale: MIN_SCALE,
    maxScale: MAX_SCALE,
  };
}

export function usePan(initial = { x: 0, y: 0 }) {
  const [offset, setOffset] = useState(initial);
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  const onPointerDown = useCallback((clientX: number, clientY: number) => {
    dragging.current = true;
    last.current = { x: clientX, y: clientY };
  }, []);

  const onPointerMove = useCallback((clientX: number, clientY: number) => {
    if (!dragging.current) return;
    const dx = clientX - last.current.x;
    const dy = clientY - last.current.y;
    last.current = { x: clientX, y: clientY };
    setOffset((o) => ({ x: o.x + dx, y: o.y + dy }));
  }, []);

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const resetPan = useCallback(() => setOffset({ x: 0, y: 0 }), []);

  return {
    offset,
    setOffset,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    resetPan,
    isDragging: dragging,
  };
}

export type OverlayMode = "boxes" | "heatmap" | "none";

export function useOverlay() {
  const [mode, setMode] = useState<OverlayMode>("boxes");
  const [showLabels, setShowLabels] = useState(true);
  const [privacyBlur, setPrivacyBlur] = useState(false);
  const [compareMode, setCompareMode] = useState<"original" | "blurred" | "side-by-side">(
    "original",
  );

  return {
    mode,
    setMode,
    showLabels,
    setShowLabels,
    privacyBlur,
    setPrivacyBlur,
    compareMode,
    setCompareMode,
  };
}

export function useSelection(initialId: string | null = null) {
  const [selectedId, setSelectedId] = useState<string | null>(initialId);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [ignoredIds, setIgnoredIds] = useState<Set<string>>(() => new Set());

  const select = useCallback((id: string | null) => setSelectedId(id), []);
  const ignore = useCallback((id: string) => {
    setIgnoredIds((prev) => new Set(prev).add(id));
    setSelectedId((cur) => (cur === id ? null : cur));
  }, []);

  return {
    selectedId,
    hoveredId,
    setHoveredId,
    select,
    ignore,
    ignoredIds,
  };
}
