
-- Ingestion jobs: tracks every content ingestion run (raw text -> structured tree)
CREATE TABLE IF NOT EXISTS public.ingestion_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by uuid,
  source text NOT NULL DEFAULT 'manual',
  scope text NOT NULL DEFAULT 'chapter',
  class_id uuid,
  subject_id uuid,
  chapter_id uuid,
  title text,
  input_preview text,
  status text NOT NULL DEFAULT 'queued',
  model text,
  tokens_in integer DEFAULT 0,
  tokens_out integer DEFAULT 0,
  cost_cents numeric DEFAULT 0,
  stats jsonb NOT NULL DEFAULT '{}'::jsonb,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.ingestion_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ingest_admin_all" ON public.ingestion_jobs
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "ingest_self_read" ON public.ingestion_jobs
  FOR SELECT USING (auth.uid() = requested_by);

CREATE TRIGGER trg_ingestion_jobs_updated
  BEFORE UPDATE ON public.ingestion_jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_status ON public.ingestion_jobs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_chapter ON public.ingestion_jobs(chapter_id);

-- Search / tag indexes for the content tree
CREATE INDEX IF NOT EXISTS idx_chapters_subject_order ON public.chapters(subject_id, order_index);
CREATE INDEX IF NOT EXISTS idx_chapters_tags ON public.chapters USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_subjects_tags ON public.subjects USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_micro_concepts_tags ON public.micro_concepts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_micro_concepts_concept ON public.micro_concepts(concept_id, order_index);
CREATE INDEX IF NOT EXISTS idx_concepts_paragraph ON public.concepts(paragraph_id, order_index);
CREATE INDEX IF NOT EXISTS idx_paragraphs_chapter ON public.paragraphs(chapter_id, order_index);
CREATE INDEX IF NOT EXISTS idx_resources_tags ON public.content_resources USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_resources_chapter ON public.content_resources(chapter_id, order_index);

-- Concept graph traversal
CREATE INDEX IF NOT EXISTS idx_concept_relations_source_rel ON public.concept_relations(source_id, relation);
CREATE INDEX IF NOT EXISTS idx_concept_relations_target ON public.concept_relations(target_id);
