
drop policy if exists "anyone can join waitlist" on public.waitlist_signups;
create policy "admins insert waitlist" on public.waitlist_signups for insert with check (public.has_role(auth.uid(),'admin'));

drop policy if exists "anyone can request demo" on public.demo_requests;
create policy "admins insert demo" on public.demo_requests for insert with check (public.has_role(auth.uid(),'admin'));

drop policy if exists "owners can create codes" on public.referral_codes;
create policy "auth users create own codes" on public.referral_codes for insert with check (
  auth.uid() is not null and owner_user_id = auth.uid()
);
