alter table public.subjects drop constraint if exists subjects_slug_key;
create unique index if not exists subjects_class_slug_key on public.subjects(class_id, slug);
alter table public.chapters drop constraint if exists chapters_slug_key;
create unique index if not exists chapters_subject_slug_key on public.chapters(subject_id, slug);
