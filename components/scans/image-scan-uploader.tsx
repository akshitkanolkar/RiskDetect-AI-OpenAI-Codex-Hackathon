"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, Loader2, Upload } from "lucide-react";
import { useImageScan } from "@/hooks/use-scans";
import { useToast } from "@/hooks/use-toast";
import { ROUTES } from "@/constants/routes";
import { MAX_IMAGE_UPLOAD_BYTES, MAX_IMAGE_UPLOAD_LABEL } from "@/constants";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { cacheScanPreview, fileToDataUrl } from "@/lib/viewer/preview-cache";

const ACCEPT = ["image/png", "image/jpeg", "image/webp"];

export function ImageScanUploader() {
  const router = useRouter();
  const { toast } = useToast();
  const scan = useImageScan();
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const onFile = useCallback(
    (next: File | null) => {
      if (!next) return;
      if (!ACCEPT.includes(next.type) && !/\.(png|jpe?g|webp)$/i.test(next.name)) {
        toast({
          variant: "destructive",
          title: "Unsupported file",
          description: "Upload a PNG, JPEG, or WEBP image.",
        });
        return;
      }
      if (next.size > MAX_IMAGE_UPLOAD_BYTES) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: `Keep uploads under ${MAX_IMAGE_UPLOAD_LABEL}.`,
        });
        return;
      }
      setFile(next);
      setPreview(URL.createObjectURL(next));
    },
    [toast],
  );

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) onFile(dropped);
  };

  const startScan = async () => {
    if (!file) return;
    setProgress(10);
    const timer = setInterval(() => setProgress((p) => Math.min(88, p + 6)), 350);
    try {
      const dataUrl = await fileToDataUrl(file);
      const result = await scan.mutateAsync(file);
      cacheScanPreview(result.id, result.image_data_url || dataUrl);
      setProgress(100);
      toast({
        title: "Screenshot analyzed",
        description: `${result.findings.length} finding(s) · ${result.risk_level}`,
      });
      router.push(`${ROUTES.SCAN_DETAIL(result.id)}?type=image`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Scan failed",
        description: error instanceof Error ? error.message : "Unable to analyze image",
      });
    } finally {
      clearInterval(timer);
      setTimeout(() => setProgress(0), 600);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 md:p-8">
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <ImageIcon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-card-title">Screenshot privacy scan</h2>
          <p className="text-caption">
            OCR extracts text and flags emails, IDs, secrets, payment handles, and more.
          </p>
        </div>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          "flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-10 text-center transition-colors",
          dragOver ? "border-brand bg-brand/5" : "border-border bg-muted/20",
        )}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Upload preview"
            className="mb-4 max-h-48 rounded-xl border border-border object-contain"
          />
        ) : (
          <Upload className="mb-3 h-8 w-8 text-brand" />
        )}
        <p className="text-sm font-medium">{file ? file.name : "Drag & drop a screenshot here"}</p>
        <p className="mt-1 text-xs text-muted-foreground">PNG, JPEG, or WEBP up to 8MB</p>
        <label className="mt-4">
          <input
            type="file"
            accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
          <Button type="button" variant="outline" asChild>
            <span>Browse files</span>
          </Button>
        </label>
      </div>

      {progress > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs text-muted-foreground">Running OCR and privacy detection…</p>
          <Progress value={progress} />
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <Button variant="brand" disabled={!file || scan.isPending} onClick={() => void startScan()}>
          {scan.isPending ? (
            <>
              <Loader2 className="animate-spin" />
              Analyzing…
            </>
          ) : (
            "Scan screenshot"
          )}
        </Button>
        {file && (
          <Button
            variant="ghost"
            disabled={scan.isPending}
            onClick={() => {
              setFile(null);
              setPreview(null);
            }}
          >
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
