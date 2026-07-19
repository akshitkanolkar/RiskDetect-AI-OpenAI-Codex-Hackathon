import { APP_NAME } from "@/constants";
import { cn } from "@/lib/utils";

const AUTHOR = "Akshit Kanolkar";

export function AppFooter({ className }: { className?: string }) {
  const year = new Date().getFullYear();

  return (
    <footer
      className={cn(
        "border-t border-border/60 px-4 py-4 text-center text-xs text-muted-foreground",
        className,
      )}
    >
      <p>
        © {year} {APP_NAME} · {AUTHOR}
      </p>
    </footer>
  );
}
