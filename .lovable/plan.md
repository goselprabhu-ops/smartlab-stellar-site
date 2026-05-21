## Goal

Turn "Start studying" into a smart gateway that respects subscription, trial, and onboarding state — and lock the student's class/board/stream at registration.

---

## 1. Database changes (one migration)

**`subscriptions`** (one row per user)
- `user_id` (unique), `plan` (`monthly` | `yearly` | `null`), `status` (`none` | `trialing` | `active` | `expired` | `canceled`), `trial_started_at`, `trial_ends_at`, `current_period_end`, timestamps
- RLS: user reads own; admin all; only server (service role) writes
- Helper RPC `has_active_access(uid)` → bool (trialing+not expired, or active)

**`profiles`** — add locked academic fields
- `class_id uuid` (FK classes), `board text` (CBSE/ICSE/State/IB/IGCSE), `stream text` (science/commerce/humanities, only for 11–12), `onboarding_completed_at timestamptz`
- These three are write-once after first set (enforced by trigger; admin bypass)

**`classes`/`subjects`** — already exist. Content readiness = at least one chapter with `published=true` linked through subject. No new flag.

---

## 2. Signup wizard — collect Class + Board + (Stream)

Edit `src/routes/signup.tsx` student wizard:
- New step "Academic": Class (6–12 from `classes` table), Board, Stream (only shown if Class is 11 or 12)
- Pass these in `raw_user_meta_data`; `handle_new_user` trigger writes them into `profiles`
- Add UI copy: "This cannot be changed later. Email support@smartlabonline.com to switch."

Lock UI in Settings: show class/board/stream as read-only with the support note.

---

## 3. `/onboarding` becomes once-only + filtered

- Route guard: if `profile.onboarding_completed_at` is set → redirect to `/student/study-path`
- The subject/goal picker only lists subjects belonging to the user's locked `class_id` AND having ≥1 published chapter (server fn `listOnboardingSubjects`)
- On completion, set `profiles.onboarding_completed_at = now()`

---

## 4. Subscription/Trial flow (stubbed payments)

- New page `/subscribe` — Monthly vs Yearly cards (price placeholders), "Start 14-day free trial" CTA
- Server fn `startTrial({ plan })` — only allowed if user has never trialed; inserts subscription row with `status='trialing'`, `trial_ends_at = now()+14d`
- After trial start → redirect to `/onboarding` (with a "Skip for now" link that goes to `/student/study-path` but flags `study_locked=true` until onboarding done)
- No real payment; `pricing.tsx` "Start free trial" buttons route to `/subscribe`

---

## 5. "Start studying" gateway

New server fn `getStudyAccess()` returns `{ hasAccess, onboarded, nextStep }`.

Replace the `<Link to="/student/study-path">Start studying</Link>` (dashboard + anywhere else) with a `<StartStudyingButton />` client component that calls `getStudyAccess()` and routes:

```text
hasAccess=false                 → /subscribe
hasAccess=true, onboarded=false → /onboarding
hasAccess=true, onboarded=true  → /student/study-path
```

Same gate enforced server-side: `/student/*` loader (via `_authenticated` layout extension) redirects per the rules above so URL hacking can't bypass it.

---

## 6. Catalog filtering

`listClasses` / `listSubjects` / courses catalog: add filter `onlyWithPublishedContent=true` (default for student views). Subjects with zero published chapters are hidden. Admin views unchanged.

---

## Technical notes

- Trigger `enforce_profile_lock` on `profiles` UPDATE: if `class_id`/`board`/`stream` already non-null and new value differs and caller is not admin → raise.
- `has_active_access` is SECURITY DEFINER, used in route guards and the gateway fn.
- All new server fns use `requireSupabaseAuth`.
- No payment provider yet — `startTrial` is the only entry to `trialing`; "Activate paid" is admin-only stub for now.
- Files: 1 migration; new `src/lib/subscription.functions.ts`, `src/lib/study-access.functions.ts`; new `src/routes/subscribe.tsx`; new `src/components/StartStudyingButton.tsx`; edits to `signup.tsx`, `onboarding.tsx`, `dashboard.tsx`, `settings.tsx`, `content.functions.ts`, `_authenticated/student/*` loaders.

Approve and I'll run the migration first, then ship the code.