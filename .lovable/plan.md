# Smart Lab Online — School Ecosystem

Build a multi-tenant institution layer on top of the existing student/parent/teacher app. Schools own batches; batches own students and teachers; everything rolls up into school-level analytics and AI insights.

## 1. Database (single migration)

New tables (all RLS-enabled, scoped via `school_members` + `has_role`):

- `schools` — id, name, slug, board (CBSE/ICSE/State), city, logo_url, plan (free/pro/enterprise), seats, active, created_by, timestamps.
- `school_members` — school_id, user_id, role (`school_admin` | `teacher` | `student` | `parent`), batch_id (nullable), status, joined_at. Composite unique (school_id, user_id, role).
- `batches` — school_id, name, grade, section, academic_year, class_teacher_id, student_count (cached), active.
- `batch_students` — batch_id, student_id, roll_no, joined_at.
- `attendance_records` — batch_id, student_id, date, status (present/absent/late/excused), marked_by, note. Unique (batch_id, student_id, date).
- `assignments` — school_id, batch_id, created_by (teacher), title, description_md, subject_id, due_at, max_score, attachments jsonb, status (draft/published/closed).
- `assignment_submissions` — assignment_id, student_id, submitted_at, content_md, attachments jsonb, score, feedback, graded_by, graded_at. Unique (assignment_id, student_id).
- `school_insights` — school_id, period (week/month), generated_at, payload jsonb (AI summary: at-risk students, top batches, engagement, mastery trend).

New app_role enum value: `school_admin`. Helper SECURITY DEFINER fns:
- `is_school_member(_user, _school)` → boolean
- `is_school_admin(_user, _school)` → boolean
- `teaches_batch(_user, _batch)` → boolean

RLS pattern: school admins read/write everything in their school; teachers read their batches + write attendance/assignments for batches they teach; students read their own attendance/assignments + submit; parents read linked child's data within school.

## 2. Server functions

`src/lib/schools.functions.ts`:
- `listMySchools`, `createSchool` (auth user becomes school_admin), `getSchoolOverview` (counts + KPIs)
- `listBatches`, `createBatch`, `addStudentsToBatch`, `removeStudentFromBatch`
- `inviteMember` (by email → creates pending school_members row), `listSchoolMembers`

`src/lib/attendance.functions.ts`:
- `getBatchAttendance(batch_id, date)`, `markBatchAttendance(records[])`, `getStudentAttendanceSummary`

`src/lib/assignments.functions.ts`:
- `listAssignments(scope)`, `createAssignment`, `publishAssignment`
- `submitAssignment`, `gradeSubmission`, `listSubmissions`

`src/lib/ai/school-insights.server.ts` + `src/lib/school-insights.functions.ts`:
- `generateSchoolInsights(school_id)` — pulls engagement, mastery, attendance, assignment completion → Lovable AI (gemini-2.5-flash) → stores in `school_insights`.
- `getLatestInsights(school_id)`.

## 3. Routes (UI)

New layout `src/routes/_authenticated/school.tsx` — sidebar nav, requires school_admin or teacher membership. Tabs:

- `school/index.tsx` — Dashboard: KPIs (students, teachers, batches, today's attendance %, avg mastery, active assignments), AI insights card, recent activity.
- `school/batches.tsx` — list/create batches, drill-in to batch detail.
- `school/batches.$batchId.tsx` — roster, attendance for date, assignments, performance.
- `school/students.tsx` — searchable directory across school with mastery/attendance columns.
- `school/teachers.tsx` — teacher list + per-teacher analytics (avg class score, assignments graded, response time).
- `school/attendance.tsx` — mark attendance flow (pick batch + date → grid).
- `school/assignments.tsx` — list + create + grade.
- `school/analytics.tsx` — institution-level charts (mastery by grade, attendance trend, engagement heatmap).
- `school/insights.tsx` — AI-generated weekly insights with regenerate button.
- `school/settings.tsx` — school profile, plan, members/invites.

Plus a top-level `/schools/onboard` route inside `_authenticated` for "Create your school" when user has no membership.

## 4. Wiring

- Add `school_admin` to `appRoleSchema` and `Role` type.
- Add School entry to main app nav for users with school_admin or teacher role.
- Reuse existing PageHeader, StatCard, Table, Tabs components — no new design tokens.

## Technical notes

- Multi-tenancy = row-level via `school_id` + helper SECURITY DEFINER fns; no schema-per-tenant.
- Role hierarchy enforced in RLS: school_admin ⊃ teacher (batch-scoped) ⊃ student.
- AI insights cached in `school_insights` to avoid per-view cost; manual + scheduled regenerate.
- All new server fns use `requireSupabaseAuth`; admin fns additionally check `is_school_admin`.
- Existing parent/student/teacher dashboards untouched — school layer is additive.

## Out of scope (this turn)

- Email-based invitations (use direct user_id linking by admin for now; stub UI shows "copy invite link").
- Billing/seats enforcement (plan field stored but not gated).
- Cross-school federation / district-level rollup.
