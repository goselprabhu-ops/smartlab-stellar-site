-- 1. Drop parent self-insert on parent_student_links (IDOR/privilege escalation)
DROP POLICY IF EXISTS "Links: parent create" ON public.parent_student_links;

-- 2. Hide answer keys: revoke column-level SELECT on quiz_questions.correct
REVOKE SELECT (correct) ON public.quiz_questions FROM anon, authenticated;

-- 3. Secure server-side scoring function (bypasses RLS / column grants)
CREATE OR REPLACE FUNCTION public.score_quiz_attempt(
  _quiz_id uuid,
  _answers jsonb
)
RETURNS TABLE(score numeric, total numeric, per_question jsonb)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  q record;
  given jsonb;
  correct_arr jsonb;
  is_correct boolean;
  s numeric := 0;
  t numeric := 0;
  per jsonb := '[]'::jsonb;
  normalize_text text;
BEGIN
  FOR q IN
    SELECT id, type::text AS type, correct, points
    FROM public.quiz_questions
    WHERE quiz_id = _quiz_id
  LOOP
    t := t + COALESCE(q.points, 0);
    given := _answers -> q.id::text;
    correct_arr := COALESCE(q.correct, '[]'::jsonb);
    is_correct := false;

    IF q.type = 'multi' THEN
      IF jsonb_typeof(given) = 'array' THEN
        IF (
          SELECT array_agg(lower(trim(value::text)) ORDER BY 1)
          FROM jsonb_array_elements_text(given)
        ) = (
          SELECT array_agg(lower(trim(value::text)) ORDER BY 1)
          FROM jsonb_array_elements_text(correct_arr)
        ) THEN
          is_correct := true;
        END IF;
      END IF;
    ELSE
      IF given IS NOT NULL AND jsonb_typeof(given) <> 'array' THEN
        normalize_text := lower(trim(given #>> '{}'));
        IF EXISTS (
          SELECT 1
          FROM jsonb_array_elements_text(correct_arr) AS c(val)
          WHERE lower(trim(c.val)) = normalize_text
        ) THEN
          is_correct := true;
        END IF;
      END IF;
    END IF;

    IF is_correct THEN
      s := s + COALESCE(q.points, 0);
    END IF;

    per := per || jsonb_build_object(
      'id', q.id,
      'is_correct', is_correct,
      'points', q.points
    );
  END LOOP;

  RETURN QUERY SELECT s, t, per;
END;
$$;

REVOKE ALL ON FUNCTION public.score_quiz_attempt(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.score_quiz_attempt(uuid, jsonb) TO authenticated;

-- 4. Helper for review screens: returns only correct keys for an attempt the caller owns
CREATE OR REPLACE FUNCTION public.get_attempt_answer_key(_attempt_id uuid)
RETURNS TABLE(question_id uuid, correct jsonb)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _student uuid;
  _quiz uuid;
BEGIN
  SELECT student_id, quiz_id INTO _student, _quiz
  FROM public.quiz_attempts
  WHERE id = _attempt_id;

  IF _student IS NULL THEN
    RETURN;
  END IF;

  IF _student <> auth.uid()
     AND NOT public.has_role(auth.uid(), 'admin')
     AND NOT public.is_linked_parent(auth.uid(), _student) THEN
    RETURN;
  END IF;

  RETURN QUERY
    SELECT id, correct
    FROM public.quiz_questions
    WHERE quiz_id = _quiz;
END;
$$;

REVOKE ALL ON FUNCTION public.get_attempt_answer_key(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_attempt_answer_key(uuid) TO authenticated;