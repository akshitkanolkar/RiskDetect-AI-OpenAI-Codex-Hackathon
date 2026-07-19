import type { Recommendation } from "@/types/scans";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const priorityVariant = {
  immediate: "destructive",
  soon: "warning",
  optional: "secondary",
} as const;

export function RecommendationCards({
  items,
  className,
}: {
  items: Recommendation[];
  className?: string;
}) {
  if (!items.length) return null;
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2", className)}>
      {items.map((item) => (
        <div key={item.id} className="glass-panel rounded-xl p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">{item.title}</h3>
            <Badge variant={priorityVariant[item.priority]}>{item.priority}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{item.description}</p>
        </div>
      ))}
    </div>
  );
}
