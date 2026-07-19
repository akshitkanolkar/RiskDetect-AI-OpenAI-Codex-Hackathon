import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
interface SuccessStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}
function SuccessState({
  title = "Success",
  description,
  action,
  className,
  ...props
}: SuccessStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-success/30 bg-success/5 px-6 py-12 text-center",
        className,
      )}
      {...props}
    >
      <CheckCircle2 className="mb-4 size-10 text-success" aria-hidden="true" />
      <h3 className="font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
export { SuccessState };
