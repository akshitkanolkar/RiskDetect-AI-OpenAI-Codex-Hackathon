import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
export interface ChipProps extends React.HTMLAttributes<HTMLDivElement> {
  onRemove?: () => void;
  removableLabel?: string;
}
const Chip = React.forwardRef<HTMLDivElement, ChipProps>(
  ({ className, children, onRemove, removableLabel = "Remove", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground",
        className,
      )}
      {...props}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 rounded-full p-0.5 hover:bg-background/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={removableLabel}
        >
          <X className="size-3" />
        </button>
      )}
    </div>
  ),
);
Chip.displayName = "Chip";
export { Chip };
