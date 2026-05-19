-- enums
do $$ begin
  create type public.bloom_level as enum ('remember','understand','apply','analyze','evaluate','create');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.relation_kind as enum (
    'prerequisite','builds_on','related','contrasts_with','applies_to','generalizes','example_of'
  );
exception when duplicate_object then null; end $$;

-- enrich micro_concepts
alter table public.micro_concepts
  add column if not exists bloom_level public.bloom_level,
  add column if not exists estimated_minutes int not null default 8,
  add column if not exists tags text[] not null default '{}';

-- typed concept graph
create table public.concept_relations (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.micro_concepts(id) on delete cascade,
  target_id uuid not null references public.micro_concepts(id) on delete cascade,
  relation public.relation_kind not null,
  weight numeric not null default 1.0 check (weight >= 0 and weight <= 1),
  notes text,
  created_at timestamptz not null default now(),
  unique (source_id, target_id, relation),
  check (source_id <> target_id)
);
create index idx_relations_source on public.concept_relations(source_id);
create index idx_relations_target on public.concept_relations(target_id);
create index idx_relations_kind on public.concept_relations(relation);
alter table public.concept_relations enable row level security;

-- rolling per-student mastery (decays over time)
create table public.concept_mastery (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  micro_concept_id uuid not null references public.micro_concepts(id) on delete cascade,
  mastery numeric not null default 0 check (mastery between 0 and 1),
  confidence numeric not null default 0 check (confidence between 0 and 1),
  streak int not null default 0,
  last_practiced_at timestamptz,
  decay_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (student_id, micro_concept_id)
);
create index idx_mastery_student on public.concept_mastery(student_id);
create index idx_mastery_decay on public.concept_mastery(student_id, decay_at);
create trigger trg_mastery_updated before update on public.concept_mastery
  for each row execute function public.set_updated_at();
alter table public.concept_mastery enable row level security;

-- RLS

-- relations: readable when parent chapter is published (or admin); admin write
create policy "Relations: read via micro_concept" on public.concept_relations for select
  using (
    exists (
      select 1
      from public.micro_concepts mc
      join public.concepts cn on cn.id = mc.concept_id
      join public.paragraphs p on p.id = cn.paragraph_id
      join public.chapters c on c.id = p.chapter_id
      where mc.id = concept_relations.source_id
        and (c.published or public.has_role(auth.uid(),'admin'))
    )
  );
create policy "Relations: admin write" on public.concept_relations for all
  using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));

-- mastery: student owns, parent reads, admin reads
create policy "Mastery: student read"   on public.concept_mastery for select using (auth.uid() = student_id);
create policy "Mastery: parent read"    on public.concept_mastery for select using (public.is_linked_parent(auth.uid(), student_id));
create policy "Mastery: admin read"     on public.concept_mastery for select using (public.has_role(auth.uid(),'admin'));
create policy "Mastery: student insert" on public.concept_mastery for insert with check (auth.uid() = student_id);
create policy "Mastery: student update" on public.concept_mastery for update using (auth.uid() = student_id);