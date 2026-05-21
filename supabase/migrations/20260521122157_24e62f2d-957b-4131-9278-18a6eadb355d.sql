-- 1. Add username column (case-insensitive uniqueness via unique index on lower)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text;

-- Format: 3-20 chars, letters/numbers/._-
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_username_format;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_username_format
  CHECK (username IS NULL OR username ~ '^[a-zA-Z0-9._-]{3,20}$');

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_uidx
  ON public.profiles (lower(username))
  WHERE username IS NOT NULL;

CREATE INDEX IF NOT EXISTS profiles_parent_email_lower_idx
  ON public.profiles (lower(parent_email))
  WHERE parent_email IS NOT NULL;

-- 2. Public RPC: check availability (no PII exposed, just boolean)
CREATE OR REPLACE FUNCTION public.username_available(_username text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _username ~ '^[a-zA-Z0-9._-]{3,20}$'
     AND NOT EXISTS (
       SELECT 1 FROM public.profiles WHERE lower(username) = lower(_username)
     );
$$;

GRANT EXECUTE ON FUNCTION public.username_available(text) TO anon, authenticated;

-- 3. Update handle_new_user to also pick up username from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  _role public.app_role;
  _meta jsonb;
  _now timestamptz := now();
  _dob date;
  _username text;
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

  _username := NULLIF(_meta->>'username', '');

  INSERT INTO public.profiles (
    user_id, full_name, username,
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
    _username,
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
$function$;

-- 4. Ensure the on-signup trigger exists (recreate idempotently)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();