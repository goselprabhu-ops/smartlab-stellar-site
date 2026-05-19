
-- =========================================================
-- ENUMS
-- =========================================================
create type public.app_role as enum ('student', 'parent', 'admin');
create type public.question_type as enum ('mcq', 'multi', 'short');

-- =========================================================
-- Generic updated_at trigger
-- =========================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================================
-- PROFILES
-- =========================================================
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text,
  grade text,
  school text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- =========================================================
-- USER ROLES (separate table to prevent privilege escalation)
-- =========================================================
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

-- Security definer role check
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

-- =========================================================
-- PARENT <-> STUDENT links
-- =========================================================
create table public.parent_student_links (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references auth.users(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (parent_id, student_id)
);
alter table public.parent_student_links enable row level security;

create or replace function public.is_linked_parent(_parent uuid, _student uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.parent_student_links
    where parent_id = _parent and student_id = _student
  );
$$;

-- =========================================================
-- SUBJECTS / COURSES / LESSONS
-- =========================================================
create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  icon text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.subjects enable row level security;
create trigger trg_subjects_updated before update on public.subjects
  for each row execute function public.set_updated_at();

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references public.subjects(id) on delete set null,
  title text not null,
  description text,
  grade text,
  cover_url text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.courses enable row level security;
create trigger trg_courses_updated before update on public.courses
  for each row execute function public.set_updated_at();
create index idx_courses_subject on public.courses(subject_id);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  content_md text,
  video_url text,
  order_index int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.lessons enable row level security;
create trigger trg_lessons_updated before update on public.lessons
  for each row execute function public.set_updated_at();
create index idx_lessons_course on public.lessons(course_id);

-- =========================================================
-- QUIZZES
-- =========================================================
create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete cascade,
  title text not null,
  time_limit_seconds int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.quizzes enable row level security;
create trigger trg_quizzes_updated before update on public.quizzes
  for each row execute function public.set_updated_at();
create index idx_quizzes_course on public.quizzes(course_id);

create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  prompt text not null,
  type public.question_type not null default 'mcq',
  options jsonb not null default '[]'::jsonb,
  correct jsonb not null default '[]'::jsonb,
  points int not null default 1,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.quiz_questions enable row level security;
create index idx_questions_quiz on public.quiz_questions(quiz_id);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  score numeric not null default 0,
  total numeric not null default 0,
  answers jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now()
);
alter table public.quiz_attempts enable row level security;
create index idx_attempts_student on public.quiz_attempts(student_id);

create table public.progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed_at timestamptz,
  mastery numeric not null default 0,
  updated_at timestamptz not null default now(),
  unique (student_id, lesson_id)
);
alter table public.progress enable row level security;
create trigger trg_progress_updated before update on public.progress
  for each row execute function public.set_updated_at();

create table public.ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  model text,
  created_at timestamptz not null default now()
);
alter table public.ai_recommendations enable row level security;

-- =========================================================
-- RLS POLICIES
-- =========================================================

-- profiles
create policy "Profiles: self read"  on public.profiles for select using (auth.uid() = user_id);
create policy "Profiles: admin read" on public.profiles for select using (public.has_role(auth.uid(), 'admin'));
create policy "Profiles: self update" on public.profiles for update using (auth.uid() = user_id);
create policy "Profiles: self insert" on public.profiles for insert with check (auth.uid() = user_id);

-- user_roles
create policy "Roles: self read"   on public.user_roles for select using (auth.uid() = user_id);
create policy "Roles: admin read"  on public.user_roles for select using (public.has_role(auth.uid(), 'admin'));
create policy "Roles: admin write" on public.user_roles for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- parent_student_links
create policy "Links: parent read"  on public.parent_student_links for select using (auth.uid() = parent_id);
create policy "Links: student read" on public.parent_student_links for select using (auth.uid() = student_id);
create policy "Links: admin all"    on public.parent_student_links for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
create policy "Links: parent create" on public.parent_student_links for insert
  with check (auth.uid() = parent_id);

-- subjects (public read)
create policy "Subjects: public read" on public.subjects for select using (true);
create policy "Subjects: admin write" on public.subjects for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- courses
create policy "Courses: read published" on public.courses for select
  using (published = true or public.has_role(auth.uid(), 'admin'));
create policy "Courses: admin write" on public.courses for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- lessons (inherit from course published flag)
create policy "Lessons: read published" on public.lessons for select
  using (
    exists (select 1 from public.courses c where c.id = lessons.course_id and c.published)
    or public.has_role(auth.uid(), 'admin')
  );
create policy "Lessons: admin write" on public.lessons for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- quizzes
create policy "Quizzes: read published" on public.quizzes for select
  using (
    exists (select 1 from public.courses c where c.id = quizzes.course_id and c.published)
    or public.has_role(auth.uid(), 'admin')
  );
create policy "Quizzes: admin write" on public.quizzes for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- quiz_questions
create policy "Questions: read published" on public.quiz_questions for select
  using (
    exists (
      select 1
      from public.quizzes q join public.courses c on c.id = q.course_id
      where q.id = quiz_questions.quiz_id and c.published
    )
    or public.has_role(auth.uid(), 'admin')
  );
create policy "Questions: admin write" on public.quiz_questions for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- quiz_attempts
create policy "Attempts: student read" on public.quiz_attempts for select using (auth.uid() = student_id);
create policy "Attempts: parent read"  on public.quiz_attempts for select
  using (public.is_linked_parent(auth.uid(), student_id));
create policy "Attempts: admin read"   on public.quiz_attempts for select using (public.has_role(auth.uid(), 'admin'));
create policy "Attempts: student insert" on public.quiz_attempts for insert with check (auth.uid() = student_id);

-- progress
create policy "Progress: student read" on public.progress for select using (auth.uid() = student_id);
create policy "Progress: parent read"  on public.progress for select
  using (public.is_linked_parent(auth.uid(), student_id));
create policy "Progress: admin read"   on public.progress for select using (public.has_role(auth.uid(), 'admin'));
create policy "Progress: student upsert" on public.progress for insert with check (auth.uid() = student_id);
create policy "Progress: student update" on public.progress for update using (auth.uid() = student_id);

-- ai_recommendations
create policy "AI: student read" on public.ai_recommendations for select using (auth.uid() = student_id);
create policy "AI: admin read"   on public.ai_recommendations for select using (public.has_role(auth.uid(), 'admin'));
create policy "AI: student insert" on public.ai_recommendations for insert with check (auth.uid() = student_id);

-- =========================================================
-- SIGNUP TRIGGER → profile + default role
-- =========================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _role public.app_role;
begin
  insert into public.profiles (user_id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email))
  on conflict (user_id) do nothing;

  _role := coalesce(
    (new.raw_user_meta_data ->> 'role')::public.app_role,
    'student'
  );
  if _role = 'admin' then _role := 'student'; end if;

  insert into public.user_roles (user_id, role)
  values (new.id, _role)
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
