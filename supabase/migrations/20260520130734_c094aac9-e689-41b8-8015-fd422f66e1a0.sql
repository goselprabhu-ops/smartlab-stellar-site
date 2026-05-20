
-- Add school_admin role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'school_admin';

-- Enums
DO $$ BEGIN
  CREATE TYPE public.school_plan AS ENUM ('free','pro','enterprise');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.attendance_status AS ENUM ('present','absent','late','excused');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.assignment_status AS ENUM ('draft','published','closed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.school_member_role AS ENUM ('school_admin','teacher','student','parent');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- schools
CREATE TABLE public.schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  board text,
  city text,
  logo_url text,
  plan public.school_plan NOT NULL DEFAULT 'free',
  seats integer NOT NULL DEFAULT 50,
  active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- school_members
CREATE TABLE public.school_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role public.school_member_role NOT NULL,
  status text NOT NULL DEFAULT 'active',
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, user_id, role)
);
ALTER TABLE public.school_members ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_school_members_user ON public.school_members(user_id);
CREATE INDEX idx_school_members_school ON public.school_members(school_id);

-- batches
CREATE TABLE public.batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  grade text,
  section text,
  academic_year text,
  class_teacher_id uuid,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_batches_school ON public.batches(school_id);

-- batch_students
CREATE TABLE public.batch_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  roll_no text,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (batch_id, student_id)
);
ALTER TABLE public.batch_students ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_batch_students_student ON public.batch_students(student_id);

-- attendance
CREATE TABLE public.attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  date date NOT NULL,
  status public.attendance_status NOT NULL,
  marked_by uuid NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (batch_id, student_id, date)
);
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_attendance_student_date ON public.attendance_records(student_id, date);
CREATE INDEX idx_attendance_batch_date ON public.attendance_records(batch_id, date);

-- assignments
CREATE TABLE public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  batch_id uuid NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  title text NOT NULL,
  description_md text,
  subject text,
  due_at timestamptz,
  max_score numeric NOT NULL DEFAULT 100,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  status public.assignment_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_assignments_batch ON public.assignments(batch_id);

-- submissions
CREATE TABLE public.assignment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  content_md text,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  score numeric,
  feedback text,
  graded_by uuid,
  graded_at timestamptz,
  UNIQUE (assignment_id, student_id)
);
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_subs_student ON public.assignment_submissions(student_id);

-- school insights cache
CREATE TABLE public.school_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  period text NOT NULL DEFAULT 'week',
  generated_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  model text
);
ALTER TABLE public.school_insights ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_school_insights_school ON public.school_insights(school_id, generated_at DESC);

-- updated_at triggers
CREATE TRIGGER trg_schools_updated BEFORE UPDATE ON public.schools
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_batches_updated BEFORE UPDATE ON public.batches
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_assignments_updated BEFORE UPDATE ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Helper functions (SECURITY DEFINER to avoid recursive RLS)
CREATE OR REPLACE FUNCTION public.is_school_member(_user uuid, _school uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.school_members
    WHERE user_id = _user AND school_id = _school AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_school_admin(_user uuid, _school uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.school_members
    WHERE user_id = _user AND school_id = _school
      AND role = 'school_admin' AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.school_for_batch(_batch uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT school_id FROM public.batches WHERE id = _batch;
$$;

CREATE OR REPLACE FUNCTION public.teaches_batch(_user uuid, _batch uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.batches b
    WHERE b.id = _batch AND (
      b.class_teacher_id = _user
      OR public.is_school_admin(_user, b.school_id)
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.student_in_batch(_student uuid, _batch uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.batch_students WHERE student_id = _student AND batch_id = _batch);
$$;

-- ============ RLS POLICIES ============

-- schools
CREATE POLICY schools_admin_all ON public.schools FOR ALL
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY schools_member_read ON public.schools FOR SELECT
  USING (is_school_member(auth.uid(), id) OR has_role(auth.uid(),'admin'));
CREATE POLICY schools_create_self ON public.schools FOR INSERT
  WITH CHECK (auth.uid() = created_by);
CREATE POLICY schools_admin_update ON public.schools FOR UPDATE
  USING (is_school_admin(auth.uid(), id));

-- school_members
CREATE POLICY sm_platform_admin ON public.school_members FOR ALL
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY sm_self_read ON public.school_members FOR SELECT
  USING (user_id = auth.uid() OR is_school_admin(auth.uid(), school_id));
CREATE POLICY sm_school_admin_write ON public.school_members FOR INSERT
  WITH CHECK (is_school_admin(auth.uid(), school_id) OR
    (NOT EXISTS (SELECT 1 FROM public.school_members WHERE school_id = school_members.school_id)
      AND user_id = auth.uid() AND role = 'school_admin'));
CREATE POLICY sm_school_admin_update ON public.school_members FOR UPDATE
  USING (is_school_admin(auth.uid(), school_id));
CREATE POLICY sm_school_admin_delete ON public.school_members FOR DELETE
  USING (is_school_admin(auth.uid(), school_id));

-- batches
CREATE POLICY batches_platform_admin ON public.batches FOR ALL
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY batches_school_read ON public.batches FOR SELECT
  USING (is_school_member(auth.uid(), school_id));
CREATE POLICY batches_admin_write ON public.batches FOR INSERT
  WITH CHECK (is_school_admin(auth.uid(), school_id));
CREATE POLICY batches_admin_update ON public.batches FOR UPDATE
  USING (is_school_admin(auth.uid(), school_id) OR class_teacher_id = auth.uid());
CREATE POLICY batches_admin_delete ON public.batches FOR DELETE
  USING (is_school_admin(auth.uid(), school_id));

-- batch_students
CREATE POLICY bs_platform_admin ON public.batch_students FOR ALL
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY bs_read ON public.batch_students FOR SELECT
  USING (
    student_id = auth.uid()
    OR is_linked_parent(auth.uid(), student_id)
    OR teaches_batch(auth.uid(), batch_id)
    OR is_school_admin(auth.uid(), school_for_batch(batch_id))
  );
CREATE POLICY bs_admin_write ON public.batch_students FOR INSERT
  WITH CHECK (is_school_admin(auth.uid(), school_for_batch(batch_id)));
CREATE POLICY bs_admin_delete ON public.batch_students FOR DELETE
  USING (is_school_admin(auth.uid(), school_for_batch(batch_id)));

-- attendance
CREATE POLICY att_platform_admin ON public.attendance_records FOR ALL
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY att_read ON public.attendance_records FOR SELECT
  USING (
    student_id = auth.uid()
    OR is_linked_parent(auth.uid(), student_id)
    OR teaches_batch(auth.uid(), batch_id)
    OR is_school_admin(auth.uid(), school_for_batch(batch_id))
  );
CREATE POLICY att_teacher_write ON public.attendance_records FOR INSERT
  WITH CHECK (teaches_batch(auth.uid(), batch_id) AND marked_by = auth.uid());
CREATE POLICY att_teacher_update ON public.attendance_records FOR UPDATE
  USING (teaches_batch(auth.uid(), batch_id));

-- assignments
CREATE POLICY asg_platform_admin ON public.assignments FOR ALL
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY asg_read ON public.assignments FOR SELECT
  USING (
    teaches_batch(auth.uid(), batch_id)
    OR is_school_admin(auth.uid(), school_id)
    OR (status = 'published' AND student_in_batch(auth.uid(), batch_id))
    OR (status = 'published' AND EXISTS (
      SELECT 1 FROM public.parent_student_links psl
      JOIN public.batch_students bs ON bs.student_id = psl.student_id
      WHERE psl.parent_id = auth.uid() AND bs.batch_id = assignments.batch_id
    ))
  );
CREATE POLICY asg_teacher_write ON public.assignments FOR INSERT
  WITH CHECK (teaches_batch(auth.uid(), batch_id) AND created_by = auth.uid());
CREATE POLICY asg_teacher_update ON public.assignments FOR UPDATE
  USING (teaches_batch(auth.uid(), batch_id));
CREATE POLICY asg_teacher_delete ON public.assignments FOR DELETE
  USING (teaches_batch(auth.uid(), batch_id));

-- submissions
CREATE POLICY sub_platform_admin ON public.assignment_submissions FOR ALL
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY sub_read ON public.assignment_submissions FOR SELECT
  USING (
    student_id = auth.uid()
    OR is_linked_parent(auth.uid(), student_id)
    OR EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = assignment_id AND (
      teaches_batch(auth.uid(), a.batch_id) OR is_school_admin(auth.uid(), a.school_id)
    ))
  );
CREATE POLICY sub_student_write ON public.assignment_submissions FOR INSERT
  WITH CHECK (student_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.assignments a WHERE a.id = assignment_id
      AND a.status = 'published' AND student_in_batch(auth.uid(), a.batch_id)
  ));
CREATE POLICY sub_student_update ON public.assignment_submissions FOR UPDATE
  USING (student_id = auth.uid() AND graded_at IS NULL);
CREATE POLICY sub_teacher_grade ON public.assignment_submissions FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = assignment_id
    AND teaches_batch(auth.uid(), a.batch_id)));

-- school_insights
CREATE POLICY si_platform_admin ON public.school_insights FOR ALL
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY si_admin_read ON public.school_insights FOR SELECT
  USING (is_school_admin(auth.uid(), school_id));
CREATE POLICY si_admin_write ON public.school_insights FOR INSERT
  WITH CHECK (is_school_admin(auth.uid(), school_id));
