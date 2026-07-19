# RiskDetect AI Design System

Premium, dark-first design language for an AI digital risk intelligence platform.

## Brand identity

- **Name:** RiskDetect AI
- **Tagline:** See digital risks before they become disasters.
- **Personality:** Trustworthy, precise, intelligent, calm under pressure.
- **Accent:** Cyan “lens” (`brand`) — not purple. Communicates scanning, clarity, and security.

## Foundations

| Token set     | Location             |
| ------------- | -------------------- |
| CSS variables | `styles/tokens.css`  |
| Theme exports | `theme/`             |
| Global styles | `app/globals.css`    |
| Tailwind map  | `tailwind.config.ts` |

### Color

Semantic tokens only — never hardcode hex in components:

- Surfaces: `background`, `surface`, `surface-elevated`, `card`
- Brand: `brand`, `brand-foreground`, `brand-muted`, `brand-glow`
- Feedback: `success`, `warning`, `danger`, `info`, `destructive`
- Risk: `risk-critical` → `risk-safe`
- Chrome: `border`, `muted`, `ring`

Light and dark themes share the same token names; `.dark` overrides values.

### Typography

- **Sans:** Plus Jakarta Sans (`--font-sans`)
- **Mono:** JetBrains Mono (`--font-mono`)

Utility classes: `.text-hero`, `.text-page`, `.text-section`, `.text-card-title`, `.text-subtitle`, `.text-body`, `.text-caption`, `.text-label`

### Spacing

8px base scale (`theme/spacing.ts`). Layout constants: sidebar `16rem` / collapsed `4.5rem`, topbar `4rem`, container max `1400px`.

### Radius

`sm` → `3xl` + `full`, driven by `--radius` (0.75rem).

### Elevation

`shadow-low` · `medium` · `high` · `floating` · `glass` · `hover` · `modal` · `dropdown` · `glow`

### Motion

Framer Motion wrappers in `components/animations/`. Respect `prefers-reduced-motion` (global CSS + hooks). Durations: 100–600ms; easing `cubic-bezier(0.22, 1, 0.36, 1)`.

## Component inventory

### `components/ui`

Primitives: Button, Input, Textarea, Select, Checkbox, Radio, Switch, Slider, OTP, Calendar, Avatar, Badge, Chip, Card, Dialog, Sheet, Alert Dialog, Popover, Hover Card, Dropdown, Context Menu, Accordion, Tabs, Tooltip, Toast, Alert, Skeleton, Spinner, Progress, Circular Progress, Table, Data Table, Breadcrumb, Pagination, Command, Scroll Area, Toggle, Collapsible, Aspect Ratio, Form.

### Layout & navigation

`AppShell`, `PageShell`, `AuthShell`, `MobileNav`, `SidebarNav`, `TopBar`, `CommandMenu`, `Breadcrumbs`, `UserMenu`, `NotificationsPanel`, `QuickActions`.

### Dashboard & charts

Stats, analytics, risk, insight cards; activity feed; status panel; widgets; grid. Recharts: area, line, bar, pie, radar, risk trend.

### Feedback & forms

Empty / error / success / loading states. Search + password inputs.

## Accessibility (WCAG AA)

- Visible `:focus-visible` rings via `--ring`
- Icon buttons require `aria-label`
- Reduced motion supported globally
- Color is never the only signal for risk (labels + icons)
- Interactive targets ≥ 36–40px where practical

## Theming

`next-themes` with `defaultTheme="dark"`, `attribute="class"`. Toggle via `ThemeToggle`. `suppressHydrationWarning` on `html`/`body` for theme class + extension attrs.

## Usage rules

1. Use semantic tokens — no one-off hex.
2. Prefer `glass-panel` / `glass-subtle` for elevated surfaces.
3. Compose variants with CVA.
4. Keep motion subtle; performance first.
5. No business logic inside design-system components.

## Extending

1. Add CSS vars to `styles/tokens.css` (light + `.dark`).
2. Map in `tailwind.config.ts` if needed.
3. Export from `theme/` when shared in TS.
4. Build the primitive in `components/ui` with CVA + `cn`.
5. Document variants here.
