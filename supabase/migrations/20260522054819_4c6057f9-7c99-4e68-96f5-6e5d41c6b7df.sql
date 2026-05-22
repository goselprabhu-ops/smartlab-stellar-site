
-- Add board scoping to subjects
ALTER TABLE public.subjects
  ADD COLUMN IF NOT EXISTS board text;

CREATE INDEX IF NOT EXISTS idx_subjects_board_class
  ON public.subjects (board, class_id);

-- Helper: return rolled-up availability of boards/classes/subjects
-- that have at least one PUBLISHED chapter with content.
CREATE OR REPLACE FUNCTION public.available_content_tree()
RETURNS TABLE (
  board text,
  class_id uuid,
  class_label text,
  class_order int,
  subject_id uuid,
  subject_name text,
  subject_slug text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT
    COALESCE(s.board, 'CBSE') AS board,
    c.id   AS class_id,
    c.label AS class_label,
    c.order_index AS class_order,
    s.id   AS subject_id,
    s.name AS subject_name,
    s.slug AS subject_slug
  FROM public.subjects s
  JOIN public.classes c ON c.id = s.class_id
  JOIN public.chapters ch ON ch.subject_id = s.id
  WHERE ch.published = true
  ORDER BY 1, 4, 6;
$$;

GRANT EXECUTE ON FUNCTION public.available_content_tree() TO anon, authenticated;
