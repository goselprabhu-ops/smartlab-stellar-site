
# Smart Lab Online — Version 1.0

The AI foundation is already built: knowledge graph, adaptive loop, mastery, remediation, retention engine, role system, RLS. v1.0 = wrap it in a premium SaaS shell, polish every surface, and make it investor-demo ready end-to-end.

I'll ship this in 6 phases. After each, we stop, you review, then I proceed.

---

## Phase 1 — Brand & Design System

- Define SML design tokens in `src/styles.css`: primary (deep indigo), accent (electric mint), surfaces, gradients (`--gradient-hero`, `--gradient-card`), elegant shadows, motion easings.
- Typography pair: Space Grotesk (headings) + Inter (body).
- Reusable primitives: `GradientCard`, `StatCard`, `KpiTile`, `SectionHeading`, `EmptyState`, `LoadingShell`, `Sparkline`.
- Animation utilities (fade-in, scale-in, hover-lift), page transitions.
- Logo lockup + favicon for "SMART LAB ONLINE".

## Phase 2 — Public Marketing Site (investor demo surface)

Separate routes (SSR + SEO, per-route head()):

- `/` — Hero, "AI-Powered Learning. Measurable Results.", animated loop visualization, social proof strip, CTA.
- `/features` — Adaptive loop, knowledge graph, mastery, remediation, retention.
- `/how-it-works` — 6-step Study→Recollect→Evaluate→Analyse→Remediate→Retain visual.
- `/for-students`, `/for-parents`, `/for-schools` — audience pages.
- `/pricing` — tiered plans (Free / Student / Family / School).
- `/about`, `/contact` (already exists — polish).
- Sticky nav, footer with sitemap, mobile drawer.

## Phase 3 — Authentication & Onboarding

- Polish `/login`, `/signup` with email/password + Google (broker).
- Role selector at signup (student / parent — admin assigned).
- Student onboarding wizard: pick class (6–12), board (CBSE), subjects, daily study goal.
- Profile completion, avatar upload.
- `/reset-password` flow verified.

## Phase 4 — Student App Shell

- App layout with `SidebarProvider` + collapsible icon sidebar.
- Sections: Dashboard, Learn, Courses, Mastery, Retention, Recommendations, Progress, Settings.
- New `/dashboard` (student): today's plan, streak, due-now count, mastery KPI, recent activity, AI nudge card, continue-learning carousel.
- Topbar: search, notifications stub, profile menu.

## Phase 5 — Polish Existing Feature Routes

Restyle the already-built routes into the new design system:

- `student/learn.$microConceptId` — phase strip, recall input, AI feedback, mastery bar.
- `student/mastery` — heatmap, KPI strip, bands.
- `student/retention` — planner, 14-day forecast, memory heatmap.
- `student/remediation.$microConceptId` — flashdeck, MCQs, visuals.
- `student/courses`, `student/progress`, `student/recommendations`, `student/quizzes`.

No logic changes — UI only.

## Phase 6 — Parent & Admin Shells (light v1.0 scope)

- `/parent` — linked students list, mastery summary per child, weekly digest card, request-link flow.
- `/admin` — content tree browser (class→subject→chapter→paragraph→concept→micro), publish toggles, user count, AI usage. (Read-heavy v1; full CRUD in v1.1.)

---

## Out of scope for v1.0

Live classes, chat tutor, payments/checkout, mobile native apps, school admin multi-tenant, gamification badges. These go into v1.1 backlog.

## Technical notes

- Stack stays: TanStack Start + Lovable Cloud + TS + Tailwind. No framework swap.
- All new server logic via `createServerFn` (no edge functions).
- RLS already enforced; roles via `user_roles` + `has_role()`.
- Each phase gets its own commit-sized batch so you can review the preview before the next phase starts.

---

**Confirm to start Phase 1 (Brand & Design System).** Reply with any tweaks — e.g. different color direction, different typography, or reorder phases — and I'll adjust before building.
