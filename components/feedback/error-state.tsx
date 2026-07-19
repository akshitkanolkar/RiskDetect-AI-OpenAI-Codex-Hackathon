import * as React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}
function ErrorState({
  title = "Something went wrong",
  description = "Please try again or return later.",
  action,
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center",
        className,
      )}
      {...props}
    >
      <AlertCircle className="mb-4 size-10 text-destructive" aria-hidden="true" />
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
export { ErrorState };
