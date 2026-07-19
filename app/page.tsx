import type { Metadata } from "next";
import Link from "next/link";
import { Shield, ScanSearch, Eye, Lock, ArrowRight, Sparkles } from "lucide-react";
import { APP_NAME, APP_TAGLINE, APP_DESCRIPTION } from "@/constants";
import { ROUTES } from "@/constants/routes";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/animations/fade-in";
import { StaggerChildren, StaggerItem } from "@/components/animations/stagger-children";
import { AppFooter } from "@/components/layout/app-footer";

export const metadata: Metadata = {
  title: `${APP_NAME} — ${APP_TAGLINE}`,
  description: APP_DESCRIPTION,
};

const FEATURES = [
  {
    icon: ScanSearch,
    title: "URL & phishing scanner",
    description: "Detect malicious links, phishing kits, and lookalike domains before you click.",
  },
  {
    icon: Lock,
    title: "Credential exposure",
    description: "Monitor leaked passwords and exposed API keys across public breach sources.",
  },
  {
    icon: Eye,
    title: "Digital footprint",
    description: "Map what of your identity is public and where privacy risks accumulate.",
  },
  {
    icon: Shield,
    title: "Threat intelligence",
    description: "Cross-check indicators against live public threat feeds and AI analysis.",
  },
] as const;

export default function HomePage() {
  return (
    <div className="relative min-h-svh overflow-hidden bg-background">
      <div className="gradient-mesh pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-12%] h-[560px] w-[920px] -translate-x-1/2 rounded-full bg-brand/10 blur-3xl" />
        <div className="absolute bottom-[-18%] right-[-8%] h-[420px] w-[520px] rounded-full bg-info/5 blur-3xl" />
      </div>

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href={ROUTES.LOGIN}>Sign in</Link>
          </Button>
          <Button variant="brand" asChild>
            <Link href={ROUTES.REGISTER}>Get started</Link>
          </Button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-16 md:pt-28">
        <FadeIn>
          <section className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              AI-powered digital risk intelligence
            </div>
            <h1 className="text-hero text-foreground">
              <span className="text-gradient">{APP_TAGLINE}</span>
            </h1>
            <p className="text-subtitle mx-auto mt-6 max-w-2xl">{APP_DESCRIPTION}</p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button variant="brand" size="lg" asChild className="glow-brand">
                <Link href={ROUTES.REGISTER}>
                  Start protecting yourself
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href={ROUTES.LOGIN}>Sign in to dashboard</Link>
              </Button>
            </div>
          </section>
        </FadeIn>

        <StaggerChildren className="mt-24 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <StaggerItem key={title}>
              <div className="glass-panel group h-full rounded-2xl p-6 transition-shadow duration-300 hover:shadow-hover">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand transition-transform duration-300 group-hover:scale-105">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h2 className="text-card-title text-foreground">{title}</h2>
                <p className="text-caption mt-2 leading-relaxed">{description}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </main>

      <AppFooter className="relative z-10 border-border/40 bg-transparent" />
    </div>
  );
}
