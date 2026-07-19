import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const statusDotVariants = cva("inline-block size-2 rounded-full", {
  variants: {
    status: {
      default: "bg-muted-foreground",
      success: "bg-success",
      warning: "bg-warning",
      danger: "bg-destructive",
      info: "bg-info",
      brand: "bg-brand",
    },
    pulse: { true: "animate-pulse" },
  },
  defaultVariants: { status: "default" },
});
interface StatusDotProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof statusDotVariants> {
  label?: string;
}
function StatusDot({ className, status, pulse, label, ...props }: StatusDotProps) {
  return (
    <span
      role={label ? "status" : undefined}
      aria-label={label}
      className={cn(statusDotVariants({ status, pulse }), className)}
      {...props}
    />
  );
}
export { StatusDot, statusDotVariants };
