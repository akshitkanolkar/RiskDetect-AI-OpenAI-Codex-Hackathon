import { Logo } from "@/components/shared/logo";
import { cn } from "@/lib/utils";

export function AuthShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main className="gradient-mesh relative flex min-h-svh items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,hsl(var(--brand)/0.08),transparent_30%)]" />
      <div className={cn("relative w-full max-w-md", className)}>
        <Logo className="mb-8 justify-center" />
        {children}
      </div>
    </main>
  );
}
