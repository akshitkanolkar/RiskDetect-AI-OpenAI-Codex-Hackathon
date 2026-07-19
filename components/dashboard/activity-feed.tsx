import type { LucideIcon } from "lucide-react";
import { Widget } from "./widget";
export interface ActivityItem {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  icon?: LucideIcon;
}
export function ActivityFeed({
  items,
  title = "Recent activity",
}: {
  items: ActivityItem[];
  title?: string;
}) {
  return (
    <Widget title={title}>
      {items.length ? (
        <ol className="space-y-4">
          {items.map(({ id, title: itemTitle, description, timestamp, icon: Icon }) => (
            <li key={id} className="flex gap-3">
              {Icon && (
                <span className="rounded-lg bg-muted p-2 text-brand">
                  <Icon className="h-4 w-4" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{itemTitle}</p>
                {description && (
                  <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
                )}
                <time className="mt-1 block text-xs text-muted-foreground">{timestamp}</time>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="py-6 text-center text-sm text-muted-foreground">No activity to show.</p>
      )}
    </Widget>
  );
}
