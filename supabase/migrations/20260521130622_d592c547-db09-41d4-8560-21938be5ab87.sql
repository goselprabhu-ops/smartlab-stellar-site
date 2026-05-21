
-- Subscriptions table
CREATE TYPE public.subscription_plan AS ENUM ('monthly', 'yearly');
CREATE TYPE public.subscription_status AS ENUM ('none','trialing','active','expired','canceled');

CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  plan public.subscription_plan,
  status public.subscription_status NOT NULL DEFAULT 'none',
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY sub_self_read ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY sub_admin_all ON public.subscriptions FOR ALL
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER subscriptions_set_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Access helper
CREATE OR REPLACE FUNCTION public.has_active_access(_user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id=_user
      AND (
        (status='trialing' AND trial_ends_at > now())
        OR (status='active' AND (current_period_end IS NULL OR current_period_end > now()))
      )
  );
$$;

-- Profile lock fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS class_id uuid REFERENCES public.classes(id),
  ADD COLUMN IF NOT EXISTS board text,
  ADD COLUMN IF NOT EXISTS stream text,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;

-- Trigger: enforce write-once for class_id, board, stream (admins bypass)
CREATE OR REPLACE FUNCTION public.enforce_profile_lock()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF public.has_role(auth.uid(),'admin') THEN RETURN NEW; END IF;
  IF OLD.class_id IS NOT NULL AND NEW.class_id IS DISTINCT FROM OLD.class_id THEN
    RAISE EXCEPTION 'Class cannot be changed. Please email support@smartlabonline.com';
  END IF;
  IF OLD.board IS NOT NULL AND NEW.board IS DISTINCT FROM OLD.board THEN
    RAISE EXCEPTION 'Board cannot be changed. Please email support@smartlabonline.com';
  END IF;
  IF OLD.stream IS NOT NULL AND NEW.stream IS DISTINCT FROM OLD.stream THEN
    RAISE EXCEPTION 'Stream cannot be changed. Please email support@smartlabonline.com';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_enforce_lock ON public.profiles;
CREATE TRIGGER profiles_enforce_lock
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_lock();

-- Extend handle_new_user to also persist class_id/board/stream from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _role public.app_role;
  _meta jsonb;
  _now timestamptz := now();
  _dob date;
  _username text;
  _class_id uuid;
BEGIN
  _meta := COALESCE(new.raw_user_meta_data, '{}'::jsonb);

  _dob := NULL;
  IF (_meta ? 'date_of_birth') AND length(_meta->>'date_of_birth') > 0 THEN
    BEGIN _dob := (_meta->>'date_of_birth')::date;
    EXCEPTION WHEN others THEN _dob := NULL; END;
  END IF;

  _username := NULLIF(_meta->>'username', '');

  _class_id := NULL;
  IF (_meta ? 'class_id') AND length(_meta->>'class_id') > 0 THEN
    BEGIN _class_id := (_meta->>'class_id')::uuid;
    EXCEPTION WHEN others THEN _class_id := NULL; END;
  END IF;

  INSERT INTO public.profiles (
    user_id, full_name, username,
    date_of_birth,
    student_full_name, student_email, student_phone,
    parent_full_name, parent_email, parent_mobile,
    parent_mobile_verified_at,
    parent_consent_accepted_at, terms_accepted_at, privacy_accepted_at,
    consent_ip, consent_user_agent,
    class_id, board, stream
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
    NULLIF(_meta->>'consent_user_agent',''),
    _class_id,
    NULLIF(_meta->>'board',''),
    NULLIF(_meta->>'stream','')
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
