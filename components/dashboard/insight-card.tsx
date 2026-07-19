import type { LucideIcon } from "lucide-react";
export function InsightCard({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <article className="glass-subtle flex gap-3 rounded-xl p-4">
      <span className="shrink-0 rounded-lg bg-brand/10 p-2 text-brand">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-medium">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        {action && <div className="mt-3">{action}</div>}
      </div>
    </article>
  );
}
