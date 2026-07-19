import Link from "next/link";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/constants";

interface LogoProps {
  className?: string;
  showText?: boolean;
  href?: string;
}

export function Logo({ className, showText = true, href = "/" }: LogoProps) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5", className)}>
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand shadow-brand">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M12 2L3 7V12C3 16.55 6.84 20.74 12 22C17.16 20.74 21 16.55 21 12V7L12 2Z"
            fill="white"
            fillOpacity="0.95"
          />
          <path
            d="M9 12L11 14L15 10"
            stroke="hsl(var(--brand-900))"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      {showText && (
        <span className="text-lg font-bold tracking-tight text-foreground">{APP_NAME}</span>
      )}
    </Link>
  );
}
