
-- 1. Extend profiles with compliance columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS student_full_name text,
  ADD COLUMN IF NOT EXISTS student_email text,
  ADD COLUMN IF NOT EXISTS student_phone text,
  ADD COLUMN IF NOT EXISTS parent_full_name text,
  ADD COLUMN IF NOT EXISTS parent_email text,
  ADD COLUMN IF NOT EXISTS parent_mobile text,
  ADD COLUMN IF NOT EXISTS parent_mobile_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS parent_consent_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS privacy_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS consent_ip text,
  ADD COLUMN IF NOT EXISTS consent_user_agent text;

-- 2. Validation trigger: enforce age 10–18 for student accounts
CREATE OR REPLACE FUNCTION public.validate_student_age()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  _age int;
  _is_student boolean;
BEGIN
  IF NEW.date_of_birth IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = NEW.user_id AND role = 'student'
  ) INTO _is_student;

  IF NOT _is_student THEN
    RETURN NEW;
  END IF;

  _age := date_part('year', age(NEW.date_of_birth));
  IF _age < 10 OR _age > 18 THEN
    RAISE EXCEPTION 'Student age must be between 10 and 18 years (got %)', _age;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_student_age ON public.profiles;
CREATE TRIGGER trg_validate_student_age
  BEFORE INSERT OR UPDATE OF date_of_birth ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_student_age();

-- 3. otp_verifications table (server-only)
CREATE TABLE IF NOT EXISTS public.otp_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mobile text NOT NULL,
  purpose text NOT NULL DEFAULT 'parent_signup',
  request_id text,
  attempts int NOT NULL DEFAULT 0,
  verified_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_otp_verifications_mobile_purpose
  ON public.otp_verifications (mobile, purpose, created_at DESC);

ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- Admins can view for support; no one else can read or write directly.
-- Server functions use the service-role admin client which bypasses RLS.
DROP POLICY IF EXISTS otp_admin_read ON public.otp_verifications;
CREATE POLICY otp_admin_read ON public.otp_verifications
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. Update handle_new_user to copy compliance metadata into profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _role public.app_role;
  _meta jsonb;
  _now timestamptz := now();
  _dob date;
BEGIN
  _meta := COALESCE(new.raw_user_meta_data, '{}'::jsonb);

  _dob := NULL;
  IF (_meta ? 'date_of_birth') AND length(_meta->>'date_of_birth') > 0 THEN
    BEGIN
      _dob := (_meta->>'date_of_birth')::date;
    EXCEPTION WHEN others THEN
      _dob := NULL;
    END;
  END IF;

  INSERT INTO public.profiles (
    user_id, full_name,
    date_of_birth,
    student_full_name, student_email, student_phone,
    parent_full_name, parent_email, parent_mobile,
    parent_mobile_verified_at,
    parent_consent_accepted_at, terms_accepted_at, privacy_accepted_at,
    consent_ip, consent_user_agent
  )
  VALUES (
    new.id,
    COALESCE(_meta->>'full_name', new.email),
    _dob,
    NULLIF(_meta->>'student_full_name',''),
    NULLIF(_meta->>'student_email',''),
    NULLIF(_meta->>'student_phone',''),
    NULLIF(_meta->>'parent_full_name',''),
    NULLIF(_meta->>'parent_email',''),
    NULLIF(_meta->>'parent_mobile',''),
    CASE WHEN (_meta->>'parent_mobile_verified')::boolean IS TRUE THEN _now ELSE NULL END,
    CASE WHEN (_meta->>'parent_consent')::boolean IS TRUE THEN _now ELSE NULL END,
    CASE WHEN (_meta->>'terms_accepted')::boolean IS TRUE THEN _now ELSE NULL END,
    CASE WHEN (_meta->>'privacy_accepted')::boolean IS TRUE THEN _now ELSE NULL END,
    NULLIF(_meta->>'consent_ip',''),
    NULLIF(_meta->>'consent_user_agent','')
  )
  ON CONFLICT (user_id) DO NOTHING;

  _role := COALESCE((_meta->>'role')::public.app_role, 'student');
  IF _role = 'admin' THEN _role := 'student'; END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN new;
END;
$$;
