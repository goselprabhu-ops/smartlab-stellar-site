# Smart Lab Online — Full App Scaffold

Layered on top of the existing marketing site (kept as-is at `/`, `/features`, `/pricing`, `/about`, `/contact`). All app surfaces go behind auth.

## 1. Database (Lovable Cloud — one migration)

New tables (all with RLS, `created_at`/`updated_at`):

- `profiles` — `user_id` (FK auth.users), `full_name`, `grade`, `school`, `avatar_url`. Auto-created via trigger on signup.
- `app_role` enum: `student`, `parent`, `admin`.
- `user_roles` — `user_id`, `role` (separate table; never on profiles to prevent privilege escalation).
- `parent_student_links` — `parent_id`, `student_id` (many-to-many).
- `subjects` — `name`, `slug`, `icon`.
- `courses` — `subject_id`, `title`, `description`, `grade`, `cover_url`, `published`.
- `lessons` — `course_id`, `title`, `content_md`, `video_url`, `order_index`.
- `quizzes` — `lesson_id` (nullable), `course_id`, `title`, `time_limit_seconds`.
- `quiz_questions` — `quiz_id`, `prompt`, `type` (mcq/multi/short), `options jsonb`, `correct jsonb`, `points`, `order_index`.
- `quiz_attempts` — `quiz_id`, `student_id`, `score`, `total`, `answers jsonb`, `submitted_at`.
- `progress` — `student_id`, `lesson_id`, `completed_at`, `mastery numeric`.
- `ai_recommendations` — `student_id`, `payload jsonb`, `model`, `created_at` (placeholder feed).

Security helpers:
- `has_role(_user_id uuid, _role app_role)` SECURITY DEFINER function.
- `is_linked_parent(_parent uuid, _student uuid)` SECURITY DEFINER.

RLS pattern:
- Students: read own progress/attempts; insert own attempts; read published courses/lessons/quizzes.
- Parents: read linked-student progress/attempts via `is_linked_parent`.
- Admins: full CRUD on courses/lessons/quizzes/subjects via `has_role(..., 'admin')`.
- Profiles: each user reads/updates own; admins read all.

Trigger: `handle_new_user` → inserts into `profiles` + `user_roles` (default `student`, or role from signup metadata).

## 2. Auth

- Email/password + Google OAuth (via Lovable Cloud broker + `configure_social_auth`).
- `auto_confirm_email: false`, `password_hibp_enabled: true`.
- `src/integrations/lovable` generated for Google.
- Routes: `/login`, `/signup` (with role selector student/parent), `/forgot-password`, `/reset-password`.
- `onAuthStateChange` wired once in `__root.tsx` → invalidates router + queryClient.

## 3. Route architecture (TanStack file-based)

Marketing (unchanged, public):
```
/  /features  /pricing  /about  /contact
/login  /signup  /forgot-password  /reset-password
```

Authenticated layout (`src/routes/_authenticated.tsx` — `beforeLoad` redirects to `/login` if no session):
```
/_authenticated/dashboard         → role-aware redirect to /student | /parent | /admin
/_authenticated/student.tsx       (layout w/ sidebar)
  ├ student.index.tsx             overview
  ├ student.courses.tsx           enrolled courses
  ├ student.courses.$courseId.tsx course detail + lessons
  ├ student.quizzes.tsx
  ├ student.quizzes.$quizId.tsx   take-quiz engine
  ├ student.progress.tsx
  └ student.recommendations.tsx   AI placeholder feed
/_authenticated/parent.tsx        (layout)
  ├ parent.index.tsx              linked students overview
  ├ parent.students.$studentId.tsx progress + attempts
  └ parent.link.tsx               request to link a student
/_authenticated/_admin.tsx        (pathless guard: hasRole('admin'))
  └ admin/
    ├ admin.index.tsx             metrics
    ├ admin.users.tsx             users + role assignment
    ├ admin.subjects.tsx
    ├ admin.courses.tsx           list
    ├ admin.courses.new.tsx       create
    ├ admin.courses.$courseId.tsx edit (+ lesson manager)
    ├ admin.quizzes.tsx
    └ admin.quizzes.$quizId.tsx   question builder
/_authenticated/settings.tsx      profile + password
```

Router context exposes `auth = { isAuthenticated, user, roles, hasRole, hasAnyRole }` sourced from a `useAuth` hook that calls a `getMe` server fn.

## 4. Modular folder structure

```
src/
  routes/                  file-based routes (above)
  components/
    ui/                    shadcn (existing)
    layout/                Header, Footer, DashboardShell, SidebarNav
    marketing/             CtaButton, SectionHeading, FeatureCard
    app/                   StatCard, ProgressBar, CourseCard, LessonItem
    quiz/                  QuizPlayer, QuestionCard, ResultSummary, Timer
    admin/                 DataTable, CourseForm, LessonForm, QuestionBuilder
    auth/                  AuthCard, RoleSelector, GoogleButton
  lib/
    auth.functions.ts      getMe, signUpWithRole
    courses.functions.ts   listCourses, getCourse, upsertCourse (admin), upsertLesson
    quizzes.functions.ts   getQuiz, submitAttempt, listAttempts
    progress.functions.ts  recordProgress, getStudentProgress
    admin.functions.ts     listUsers, assignRole, metrics
    ai.functions.ts        getRecommendations (stub returning canned items)
    schemas.ts             shared Zod schemas
  hooks/
    use-auth.ts            wraps getMe + onAuthStateChange
    use-role.ts            convenience helpers
  integrations/supabase/   (existing, do not edit)
  integrations/lovable/    (generated by configure_social_auth)
  styles.css               (current brand system)
```

Every server fn lives in `*.functions.ts` (thin), validates with Zod, uses `requireSupabaseAuth` middleware, and returns serialization-safe DTOs. Admin-only fns add an inline `hasRole('admin')` check on top of RLS.

## 5. Quiz engine (MVP)

- `QuizPlayer` loads quiz + questions, runs client timer, stores answers locally, submits via `submitAttempt` server fn.
- Server scores against `quiz_questions.correct`, writes to `quiz_attempts`, updates `progress.mastery` (simple weighted avg).
- Supports MCQ (single), multi-select, short text (exact match for now).
- Result screen with per-question feedback + retake link.

## 6. AI recommendation placeholder

- `getRecommendations` server fn returns 3 canned cards (e.g. "Revise Algebra · Linear Equations", "Practice quiz: Light & Reflection") tagged with subject + reason.
- UI on `student.recommendations.tsx` renders cards with "Start" buttons linking to relevant course/quiz.
- Hookable: later swap stub body for a Lovable AI Gateway call (`google/gemini-2.5-flash`) using `progress` + `quiz_attempts` as context.

## 7. Responsive / mobile-first

- All dashboards use a collapsible sidebar (`Sheet` on mobile, fixed on `lg`).
- Tables use card-list fallback under `md`.
- Quiz player single-column on mobile, two-column (question + nav) on `md+`.
- Reuses current brand tokens (`--blue`, `--cyan`, glass) — light mode default, dark-ready.

## 8. Build order (single loop, lots of tool calls)

1. Migration: tables + enum + helpers + RLS + signup trigger.
2. `configure_social_auth(["google"])` + `configure_auth` (no auto-confirm, HIBP on).
3. Server fns: `auth`, `courses`, `quizzes`, `progress`, `admin`, `ai`.
4. Hooks + router context wiring + `__root.tsx` auth listener.
5. Auth pages (login/signup/forgot/reset).
6. `_authenticated` + `_admin` guard layouts + `DashboardShell`.
7. Student, parent, admin route files with skeletons + real data wiring.
8. Quiz player + admin question builder.
9. Seed a couple of demo subjects/courses/quizzes via `insert` so dashboards aren't empty.

## Technical notes

- `attachSupabaseAuth` already in `src/start.ts` (verify).
- Public routes never call protected server fns from loaders (would 401 in prerender).
- `_authenticated.tsx` gates with `beforeLoad` + `supabase.auth.getUser()` for session hydration before loader runs.
- No Supabase Edge Functions — all server logic via `createServerFn`.
- Role assignment to `admin` is admin-only; signup form only offers `student`/`parent`.

Marketing site stays untouched. Approve and I'll execute end-to-end.
