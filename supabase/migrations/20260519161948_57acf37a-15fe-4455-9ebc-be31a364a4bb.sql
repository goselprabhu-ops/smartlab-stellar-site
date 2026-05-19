-- Test engine: extend quizzes with classification + ownership
ALTER TABLE public.quizzes
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'chapter',
  ADD COLUMN IF NOT EXISTS class_id uuid,
  ADD COLUMN IF NOT EXISTS subject_id uuid,
  ADD COLUMN IF NOT EXISTS chapter_id uuid,
  ADD COLUMN IF NOT EXISTS difficulty smallint NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_by uuid;

ALTER TABLE public.quizzes
  ADD CONSTRAINT quizzes_kind_check CHECK (kind IN ('chapter','micro','full_mock','ai','diagnostic'));

CREATE INDEX IF NOT EXISTS idx_quizzes_class ON public.quizzes(class_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_subject ON public.quizzes(subject_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_chapter ON public.quizzes(chapter_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_kind ON public.quizzes(kind);
CREATE INDEX IF NOT EXISTS idx_quizzes_created_by ON public.quizzes(created_by);

-- Replace RLS read policies (course_id is now optional)
DROP POLICY IF EXISTS "Quizzes: read published" ON public.quizzes;
CREATE POLICY "Quizzes: read published" ON public.quizzes FOR SELECT USING (
  published = true
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (created_by IS NOT NULL AND created_by = auth.uid())
);

DROP POLICY IF EXISTS "Questions: read published" ON public.quiz_questions;
CREATE POLICY "Questions: read published" ON public.quiz_questions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.quizzes q
    WHERE q.id = quiz_questions.quiz_id
      AND (
        q.published = true
        OR has_role(auth.uid(), 'admin'::app_role)
        OR (q.created_by IS NOT NULL AND q.created_by = auth.uid())
      )
  )
);

-- Allow students to create their own AI-generated quizzes + questions
CREATE POLICY "Quizzes: student AI create" ON public.quizzes FOR INSERT
WITH CHECK (kind = 'ai' AND created_by = auth.uid());

CREATE POLICY "Questions: student AI create" ON public.quiz_questions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.quizzes q
    WHERE q.id = quiz_questions.quiz_id
      AND q.kind = 'ai'
      AND q.created_by = auth.uid()
  )
);