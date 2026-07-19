import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface QuickAction {
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
  disabled?: boolean;
}
export function QuickActions({
  actions,
  className,
}: {
  actions: QuickAction[];
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {actions.map(({ label, icon: Icon, ...action }) => (
        <Button key={label} variant="outline" size="sm" {...action}>
          <Icon />
          {label}
        </Button>
      ))}
    </div>
  );
}
