import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
function Spinner({ className, ...props }: React.ComponentProps<typeof Loader2>) {
  return (
    <Loader2
      className={cn("size-4 animate-spin text-muted-foreground", className)}
      aria-label="Loading"
      role="status"
      {...props}
    />
  );
}
export { Spinner };
