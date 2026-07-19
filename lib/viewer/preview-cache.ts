/**
 * Client-side cache so the uploaded screenshot survives navigation to the
 * result page even when the server omits a large data URL.
 */
const PREFIX = "riskdetect:scan-preview:";

export function cacheScanPreview(scanId: string, dataUrl: string) {
  try {
    sessionStorage.setItem(`${PREFIX}${scanId}`, dataUrl);
  } catch {
    // Quota exceeded — ignore; server may still hold the image.
  }
}

export function readScanPreview(scanId: string): string | null {
  try {
    return sessionStorage.getItem(`${PREFIX}${scanId}`);
  } catch {
    return null;
  }
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
