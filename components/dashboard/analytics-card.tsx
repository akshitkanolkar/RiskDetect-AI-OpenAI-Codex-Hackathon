import { Widget } from "./widget";
export function AnalyticsCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Widget title={title} description={description} className={className}>
      <div className="h-72">{children}</div>
    </Widget>
  );
}
