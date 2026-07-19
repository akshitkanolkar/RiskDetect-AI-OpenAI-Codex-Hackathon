import { Logo } from "@/components/shared/logo";
import { AppFooter } from "@/components/layout/app-footer";
import { cn } from "@/lib/utils";

export function AuthShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="gradient-mesh relative flex min-h-svh flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,hsl(var(--brand)/0.08),transparent_30%)]" />
      <main className="relative flex flex-1 items-center justify-center px-4 py-10">
        <div className={cn("w-full max-w-md", className)}>
          <Logo className="mb-8 justify-center" />
          {children}
        </div>
      </main>
      <AppFooter className="relative border-border/40 bg-transparent" />
    </div>
  );
}
