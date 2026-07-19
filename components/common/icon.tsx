import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
interface IconProps extends Omit<React.ComponentProps<LucideIcon>, "ref"> {
  icon: LucideIcon;
  label?: string;
}
function Icon({ icon: IconComponent, label, className, ...props }: IconProps) {
  return (
    <IconComponent
      className={cn("size-4 shrink-0", className)}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
      {...props}
    />
  );
}
export { Icon };
