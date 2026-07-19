import { CheckCircle2, CircleAlert, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";
export function StatusPanel({
  status,
  title,
  description,
}: {
  status: "healthy" | "warning" | "loading";
  title: string;
  description?: string;
}) {
  const Icon =
    status === "healthy" ? CheckCircle2 : status === "warning" ? CircleAlert : LoaderCircle;
  return (
    <div className="glass-panel flex items-start gap-3 rounded-xl p-4">
      <Icon
        className={cn(
          "mt-0.5 h-5 w-5",
          status === "healthy"
            ? "text-success"
            : status === "warning"
              ? "text-warning"
              : "animate-spin text-brand",
        )}
      />
      <div>
        <p className="text-sm font-medium">{title}</p>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}
