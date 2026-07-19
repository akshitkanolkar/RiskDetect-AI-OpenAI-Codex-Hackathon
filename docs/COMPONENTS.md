# Component documentation

Quick reference for RiskDetect AI reusable UI. Import paths use the `@/` alias.

## Buttons

```tsx
import { Button } from "@/components/ui/button";

<Button variant="brand" loading>Scan URL</Button>
<Button variant="outline" size="sm">Cancel</Button>
<Button variant="ghost" size="icon" aria-label="Open menu">…</Button>
```

Variants: `default` · `secondary` · `outline` · `ghost` · `destructive` · `success` · `brand` · `link`

## Cards & glass

```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

<div className="glass-panel rounded-2xl p-6">…</div>;
```

## Stats & risk

```tsx
import { StatsCard } from "@/components/dashboard/stats-card";
import { RiskCard } from "@/components/dashboard/risk-card";
import { RiskBadge } from "@/components/common/risk-badge";

<StatsCard icon={Shield} label="Threats" value={12} delta="+2" trend="up" />
<RiskCard level="high" score={78} description="Credential leak detected" />
```

## Charts

```tsx
import { RiskTrendChart } from "@/components/charts/risk-trend-chart";

<div className="h-72">
  <RiskTrendChart data={[{ date: "Mon", score: 20 }]} />
</div>;
```

Pass data as props. Colors resolve from CSS variables.

## Data table

```tsx
import { DataTable } from "@/components/ui/data-table";

<DataTable
  columns={[
    { key: "target", header: "Target", sortable: true },
    { key: "status", header: "Status", render: (row) => row.status },
  ]}
  data={rows}
  searchable
/>;
```

## Feedback states

```tsx
import { EmptyState } from "@/components/feedback/empty-state";
import { LoadingState } from "@/components/feedback/loading-state";

<EmptyState title="No scans" description="Start your first scan." />
<LoadingState label="Analyzing URL…" />
```

## Motion

```tsx
import { FadeIn } from "@/components/animations/fade-in";
import { StaggerChildren, StaggerItem } from "@/components/animations/stagger-children";

<FadeIn><h1>…</h1></FadeIn>
<StaggerChildren>
  <StaggerItem>…</StaggerItem>
</StaggerChildren>
```

## Shells

```tsx
import { AppShell } from "@/components/layout/app-shell";
import { PageShell } from "@/components/layout/page-shell";
import { AuthShell } from "@/components/layout/auth-shell";
```

`AppShell` expects an authenticated Supabase `user`. Dashboard routes already wire this in `app/(dashboard)/layout.tsx`.

## Forms

```tsx
import { SearchInput } from "@/components/forms/search-input";
import { PasswordInput } from "@/components/forms/password-input";
```

## Command palette

Mounted from the top bar / app shell. Shortcut: ⌘K / Ctrl+K. Implementation: `components/navigation/command-menu.tsx`.
