
-- waitlist_signups
create table public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text,
  role text check (role in ('student','parent','teacher','school')) default 'student',
  grade text,
  city text,
  source text,
  referral_code text,
  referred_by_code text,
  utm jsonb default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','invited','onboarded','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(email)
);
create index on public.waitlist_signups (created_at desc);
create index on public.waitlist_signups (status);

alter table public.waitlist_signups enable row level security;
create policy "anyone can join waitlist" on public.waitlist_signups for insert with check (true);
create policy "admins read waitlist" on public.waitlist_signups for select using (public.has_role(auth.uid(),'admin'));
create policy "admins update waitlist" on public.waitlist_signups for update using (public.has_role(auth.uid(),'admin'));
create policy "admins delete waitlist" on public.waitlist_signups for delete using (public.has_role(auth.uid(),'admin'));

create trigger waitlist_set_updated_at before update on public.waitlist_signups
  for each row execute function public.set_updated_at();

-- referral_codes
create table public.referral_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  owner_email text,
  owner_user_id uuid references auth.users(id) on delete set null,
  clicks integer not null default 0,
  signups integer not null default 0,
  created_at timestamptz not null default now()
);
create index on public.referral_codes (owner_user_id);

alter table public.referral_codes enable row level security;
create policy "public can read referral codes" on public.referral_codes for select using (true);
create policy "owners can create codes" on public.referral_codes for insert with check (
  owner_user_id is null or owner_user_id = auth.uid()
);
create policy "admins manage referral codes" on public.referral_codes for update using (public.has_role(auth.uid(),'admin'));
create policy "admins delete referral codes" on public.referral_codes for delete using (public.has_role(auth.uid(),'admin'));

-- demo_requests
create table public.demo_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  role text check (role in ('student','parent','teacher','school')) default 'parent',
  grade text,
  school text,
  preferred_date date,
  preferred_time text,
  notes text,
  status text not null default 'new' check (status in ('new','scheduled','done','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.demo_requests (created_at desc);

alter table public.demo_requests enable row level security;
create policy "anyone can request demo" on public.demo_requests for insert with check (true);
create policy "admins read demo requests" on public.demo_requests for select using (public.has_role(auth.uid(),'admin'));
create policy "admins update demo requests" on public.demo_requests for update using (public.has_role(auth.uid(),'admin'));
create policy "admins delete demo requests" on public.demo_requests for delete using (public.has_role(auth.uid(),'admin'));

create trigger demo_requests_set_updated_at before update on public.demo_requests
  for each row execute function public.set_updated_at();

-- launch_config single-row
create table public.launch_config (
  id integer primary key default 1 check (id = 1),
  launch_at timestamptz,
  demo_mode_enabled boolean not null default false,
  waitlist_open boolean not null default true,
  referral_reward text default '1 month free Pro',
  updated_at timestamptz not null default now()
);
insert into public.launch_config (id, launch_at) values (1, now() + interval '30 days') on conflict do nothing;

alter table public.launch_config enable row level security;
create policy "anyone can read launch config" on public.launch_config for select using (true);
create policy "admins update launch config" on public.launch_config for update using (public.has_role(auth.uid(),'admin'));

create trigger launch_config_set_updated_at before update on public.launch_config
  for each row execute function public.set_updated_at();

-- launch_checklist
create table public.launch_checklist (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  category text default 'general',
  status text not null default 'todo' check (status in ('todo','in_progress','done','blocked')),
  owner text,
  notes text,
  order_index integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.launch_checklist enable row level security;
create policy "admins read checklist" on public.launch_checklist for select using (public.has_role(auth.uid(),'admin'));
create policy "admins write checklist" on public.launch_checklist for insert with check (public.has_role(auth.uid(),'admin'));
create policy "admins update checklist" on public.launch_checklist for update using (public.has_role(auth.uid(),'admin'));
create policy "admins delete checklist" on public.launch_checklist for delete using (public.has_role(auth.uid(),'admin'));

create trigger launch_checklist_set_updated_at before update on public.launch_checklist
  for each row execute function public.set_updated_at();

-- seed checklist
insert into public.launch_checklist (label, category, status, order_index) values
  ('Finalize landing page copy', 'marketing', 'in_progress', 1),
  ('QA signup + onboarding flow', 'product', 'todo', 2),
  ('Verify email domain (DKIM/SPF)', 'infra', 'todo', 3),
  ('Load test waitlist endpoint', 'infra', 'todo', 4),
  ('Schedule launch announcement', 'marketing', 'todo', 5),
  ('Enable WhatsApp support line', 'support', 'todo', 6),
  ('Publish privacy + terms', 'legal', 'todo', 7),
  ('Configure analytics + funnels', 'data', 'todo', 8),
  ('Seed early access invites', 'growth', 'todo', 9),
  ('Backup + rollback plan', 'infra', 'todo', 10);
