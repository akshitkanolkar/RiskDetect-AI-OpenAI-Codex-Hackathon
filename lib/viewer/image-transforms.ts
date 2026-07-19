export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Map image-space rect to overlay % style given natural image size. */
export function rectToPercent(rect: Rect, image: Size): Rect {
  if (image.width <= 0 || image.height <= 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  return {
    x: (rect.x / image.width) * 100,
    y: (rect.y / image.height) * 100,
    width: (rect.width / image.width) * 100,
    height: (rect.height / image.height) * 100,
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function fitScale(container: Size, image: Size, padding = 16): number {
  if (image.width <= 0 || image.height <= 0) return 1;
  const availW = Math.max(1, container.width - padding * 2);
  const availH = Math.max(1, container.height - padding * 2);
  return Math.min(availW / image.width, availH / image.height, 1);
}

export function centerOffset(container: Size, image: Size, scale: number): Point {
  return {
    x: (container.width - image.width * scale) / 2,
    y: (container.height - image.height * scale) / 2,
  };
}

/** Viewport rectangle in image coordinates for minimap. */
export function viewportInImageSpace(
  container: Size,
  image: Size,
  scale: number,
  offset: Point,
): Rect {
  const left = Math.max(0, -offset.x / scale);
  const top = Math.max(0, -offset.y / scale);
  const width = Math.min(image.width - left, container.width / scale);
  const height = Math.min(image.height - top, container.height / scale);
  return { x: left, y: top, width: Math.max(0, width), height: Math.max(0, height) };
}

export function downloadDataUrl(dataUrl: string, fileName: string) {
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = fileName;
  anchor.click();
}
