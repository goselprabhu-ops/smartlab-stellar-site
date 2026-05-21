-- One free trial per parent (by email or mobile), shared subscription across siblings

CREATE TABLE IF NOT EXISTS public.parent_trial_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_email_norm text NOT NULL,
  parent_mobile_norm text NOT NULL,
  first_user_id uuid NOT NULL,
  plan public.subscription_plan,
  trial_started_at timestamptz NOT NULL DEFAULT now(),
  trial_ends_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS parent_trial_ledger_email_uidx
  ON public.parent_trial_ledger (parent_email_norm);
CREATE UNIQUE INDEX IF NOT EXISTS parent_trial_ledger_mobile_uidx
  ON public.parent_trial_ledger (parent_mobile_norm);

ALTER TABLE public.parent_trial_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY ptl_admin_all ON public.parent_trial_ledger
  FOR ALL USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY ptl_self_read ON public.parent_trial_ledger
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND (lower(trim(p.parent_email)) = parent_email_norm
             OR regexp_replace(coalesce(p.parent_mobile,''),'\D','','g') = parent_mobile_norm)
    )
  );

-- Replace has_active_access: any user sharing parent_email or parent_mobile counts
CREATE OR REPLACE FUNCTION public.has_active_access(_user uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH me AS (
    SELECT lower(trim(parent_email)) AS pe,
           regexp_replace(coalesce(parent_mobile,''),'\D','','g') AS pm
    FROM public.profiles WHERE user_id = _user
  ),
  family AS (
    SELECT p.user_id
    FROM public.profiles p, me
    WHERE (me.pe <> '' AND lower(trim(p.parent_email)) = me.pe)
       OR (me.pm <> '' AND regexp_replace(coalesce(p.parent_mobile,''),'\D','','g') = me.pm)
       OR p.user_id = _user
  )
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions s
    JOIN family f ON f.user_id = s.user_id
    WHERE (s.status='trialing' AND s.trial_ends_at > now())
       OR (s.status='active' AND (s.current_period_end IS NULL OR s.current_period_end > now()))
  );
$$;