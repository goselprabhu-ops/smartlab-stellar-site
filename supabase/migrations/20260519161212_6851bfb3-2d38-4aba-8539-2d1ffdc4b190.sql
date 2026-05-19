create extension if not exists pg_trgm;

do $$ begin
  create type public.resource_kind as enum ('video','pdf','note','link');
exception when duplicate_object then null; end $$;

create table if not exists public.content_resources (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid references public.chapters(id) on delete cascade,
  paragraph_id uuid references public.paragraphs(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete cascade,
  micro_concept_id uuid references public.micro_concepts(id) on delete cascade,
  kind public.resource_kind not null,
  title text not null,
  description text,
  url text not null,
  thumbnail_url text,
  duration_seconds integer,
  size_bytes bigint,
  tags text[] not null default '{}',
  order_index integer not null default 0,
  published boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint resources_has_parent check (
    chapter_id is not null or paragraph_id is not null or lesson_id is not null or micro_concept_id is not null
  )
);

create index if not exists idx_resources_chapter on public.content_resources(chapter_id);
create index if not exists idx_resources_paragraph on public.content_resources(paragraph_id);
create index if not exists idx_resources_lesson on public.content_resources(lesson_id);
create index if not exists idx_resources_kind on public.content_resources(kind);
create index if not exists idx_resources_tags on public.content_resources using gin(tags);
create index if not exists idx_resources_title_trgm on public.content_resources using gin (title gin_trgm_ops);

alter table public.content_resources enable row level security;

drop policy if exists "Resources: admin write" on public.content_resources;
create policy "Resources: admin write" on public.content_resources
  for all using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));

drop policy if exists "Resources: read published" on public.content_resources;
create policy "Resources: read published" on public.content_resources
  for select using (published or public.has_role(auth.uid(),'admin'));

drop trigger if exists trg_resources_updated_at on public.content_resources;
create trigger trg_resources_updated_at
  before update on public.content_resources
  for each row execute function public.set_updated_at();

alter table public.chapters add column if not exists tags text[] not null default '{}';
alter table public.subjects add column if not exists tags text[] not null default '{}';
alter table public.subjects add column if not exists description text;
alter table public.lessons add column if not exists tags text[] not null default '{}';

create index if not exists idx_chapters_tags on public.chapters using gin(tags);
create index if not exists idx_chapters_subject on public.chapters(subject_id);
create index if not exists idx_subjects_class on public.subjects(class_id);
create index if not exists idx_chapters_title_trgm on public.chapters using gin (title gin_trgm_ops);
create index if not exists idx_subjects_name_trgm on public.subjects using gin (name gin_trgm_ops);

insert into public.classes (label, order_index)
select 'Class ' || g, g - 5
from generate_series(6,12) g
where not exists (select 1 from public.classes c where c.label = 'Class ' || g);
