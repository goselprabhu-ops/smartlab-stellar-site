-- enums
do $$ begin
  create type public.learning_state as enum (
    'not_started','studying','recollecting','evaluating','weak','remediating','mastered'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.remediation_kind as enum (
    'reexplain','practice','solution_walkthrough','diagram_prompt'
  );
exception when duplicate_object then null; end $$;

-- curriculum tree
create table public.classes (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.classes enable row level security;

alter table public.subjects
  add column if not exists class_id uuid references public.classes(id) on delete set null;
create index if not exists idx_subjects_class on public.subjects(class_id);

create table public.chapters (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  title text not null,
  slug text not null,
  summary_md text,
  order_index int not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subject_id, slug)
);
create index idx_chapters_subject on public.chapters(subject_id);
create trigger trg_chapters_updated before update on public.chapters
  for each row execute function public.set_updated_at();
alter table public.chapters enable row level security;

create table public.paragraphs (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  title text not null,
  summary_md text,
  order_index int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_paragraphs_chapter on public.paragraphs(chapter_id);
create trigger trg_paragraphs_updated before update on public.paragraphs
  for each row execute function public.set_updated_at();
alter table public.paragraphs enable row level security;

create table public.concepts (
  id uuid primary key default gen_random_uuid(),
  paragraph_id uuid not null references public.paragraphs(id) on delete cascade,
  title text not null,
  summary_md text,
  order_index int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_concepts_paragraph on public.concepts(paragraph_id);
create trigger trg_concepts_updated before update on public.concepts
  for each row execute function public.set_updated_at();
alter table public.concepts enable row level security;

create table public.micro_concepts (
  id uuid primary key default gen_random_uuid(),
  concept_id uuid not null references public.concepts(id) on delete cascade,
  title text not null,
  learning_objective text,
  content_md text,
  difficulty smallint not null default 1,
  prerequisite_ids uuid[] not null default '{}',
  order_index int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_micro_concepts_concept on public.micro_concepts(concept_id);
create trigger trg_micro_concepts_updated before update on public.micro_concepts
  for each row execute function public.set_updated_at();
alter table public.micro_concepts enable row level security;

alter table public.lessons
  add column if not exists micro_concept_id uuid references public.micro_concepts(id) on delete set null;
create index if not exists idx_lessons_micro on public.lessons(micro_concept_id);

alter table public.quiz_questions
  add column if not exists micro_concept_id uuid references public.micro_concepts(id) on delete set null;
create index if not exists idx_questions_micro on public.quiz_questions(micro_concept_id);

-- adaptive loop
create table public.learning_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  micro_concept_id uuid not null references public.micro_concepts(id) on delete cascade,
  state public.learning_state not null default 'not_started',
  mastery numeric not null default 0,
  attempts int not null default 0,
  last_event_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, micro_concept_id)
);
create index idx_sessions_student on public.learning_sessions(student_id);
create trigger trg_sessions_updated before update on public.learning_sessions
  for each row execute function public.set_updated_at();
alter table public.learning_sessions enable row level security;

create table public.recollection_attempts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.learning_sessions(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  prompt text not null,
  student_response text not null,
  ai_score numeric,
  ai_feedback jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index idx_recollection_session on public.recollection_attempts(session_id);
alter table public.recollection_attempts enable row level security;

create table public.evaluation_attempts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.learning_sessions(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  quiz_id uuid references public.quizzes(id) on delete set null,
  score numeric not null default 0,
  total numeric not null default 0,
  per_question jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index idx_evaluation_session on public.evaluation_attempts(session_id);
alter table public.evaluation_attempts enable row level security;

create table public.weakness_profile (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  micro_concept_id uuid not null references public.micro_concepts(id) on delete cascade,
  weakness_tags text[] not null default '{}',
  confidence numeric not null default 0,
  notes text,
  updated_at timestamptz not null default now(),
  unique (student_id, micro_concept_id)
);
create index idx_weakness_student on public.weakness_profile(student_id);
create trigger trg_weakness_updated before update on public.weakness_profile
  for each row execute function public.set_updated_at();
alter table public.weakness_profile enable row level security;

create table public.ai_generated_material (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.learning_sessions(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  kind public.remediation_kind not null,
  payload jsonb not null default '{}'::jsonb,
  model text,
  prompt_hash text,
  created_at timestamptz not null default now()
);
create index idx_ai_material_session on public.ai_generated_material(session_id);
alter table public.ai_generated_material enable row level security;

-- RLS policies
create policy "Classes: public read" on public.classes for select using (true);
create policy "Classes: admin write" on public.classes for all
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create policy "Chapters: read published" on public.chapters for select
  using (published or public.has_role(auth.uid(),'admin'));
create policy "Chapters: admin write" on public.chapters for all
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create policy "Paragraphs: read via chapter" on public.paragraphs for select
  using (exists (select 1 from public.chapters c where c.id=paragraphs.chapter_id and (c.published or public.has_role(auth.uid(),'admin'))));
create policy "Paragraphs: admin write" on public.paragraphs for all
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create policy "Concepts: read via paragraph" on public.concepts for select
  using (exists (
    select 1 from public.paragraphs p join public.chapters c on c.id=p.chapter_id
    where p.id=concepts.paragraph_id and (c.published or public.has_role(auth.uid(),'admin'))
  ));
create policy "Concepts: admin write" on public.concepts for all
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create policy "Micro: read via concept" on public.micro_concepts for select
  using (exists (
    select 1 from public.concepts cn
    join public.paragraphs p on p.id=cn.paragraph_id
    join public.chapters c on c.id=p.chapter_id
    where cn.id=micro_concepts.concept_id and (c.published or public.has_role(auth.uid(),'admin'))
  ));
create policy "Micro: admin write" on public.micro_concepts for all
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create policy "Sessions: student read" on public.learning_sessions for select using (auth.uid()=student_id);
create policy "Sessions: parent read" on public.learning_sessions for select using (public.is_linked_parent(auth.uid(),student_id));
create policy "Sessions: admin read"  on public.learning_sessions for select using (public.has_role(auth.uid(),'admin'));
create policy "Sessions: student insert" on public.learning_sessions for insert with check (auth.uid()=student_id);
create policy "Sessions: student update" on public.learning_sessions for update using (auth.uid()=student_id);

create policy "Recall: student read"  on public.recollection_attempts for select using (auth.uid()=student_id);
create policy "Recall: parent read"   on public.recollection_attempts for select using (public.is_linked_parent(auth.uid(),student_id));
create policy "Recall: admin read"    on public.recollection_attempts for select using (public.has_role(auth.uid(),'admin'));
create policy "Recall: student insert" on public.recollection_attempts for insert with check (auth.uid()=student_id);

create policy "Eval: student read"  on public.evaluation_attempts for select using (auth.uid()=student_id);
create policy "Eval: parent read"   on public.evaluation_attempts for select using (public.is_linked_parent(auth.uid(),student_id));
create policy "Eval: admin read"    on public.evaluation_attempts for select using (public.has_role(auth.uid(),'admin'));
create policy "Eval: student insert" on public.evaluation_attempts for insert with check (auth.uid()=student_id);

create policy "Weakness: student read"  on public.weakness_profile for select using (auth.uid()=student_id);
create policy "Weakness: parent read"   on public.weakness_profile for select using (public.is_linked_parent(auth.uid(),student_id));
create policy "Weakness: admin read"    on public.weakness_profile for select using (public.has_role(auth.uid(),'admin'));
create policy "Weakness: student insert" on public.weakness_profile for insert with check (auth.uid()=student_id);
create policy "Weakness: student update" on public.weakness_profile for update using (auth.uid()=student_id);

create policy "AIMat: student read"  on public.ai_generated_material for select using (auth.uid()=student_id);
create policy "AIMat: parent read"   on public.ai_generated_material for select using (public.is_linked_parent(auth.uid(),student_id));
create policy "AIMat: admin read"    on public.ai_generated_material for select using (public.has_role(auth.uid(),'admin'));
create policy "AIMat: student insert" on public.ai_generated_material for insert with check (auth.uid()=student_id);