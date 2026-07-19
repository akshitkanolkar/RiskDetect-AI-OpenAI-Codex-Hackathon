import * as React from "react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
interface LoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
}
function LoadingState({ label = "Loading…", className, ...props }: LoadingStateProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl px-6 py-12 text-center",
        className,
      )}
      {...props}
    >
      <Spinner className="size-6 text-brand" />
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}
export { LoadingState };
