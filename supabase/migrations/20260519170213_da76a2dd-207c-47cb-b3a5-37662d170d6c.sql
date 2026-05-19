-- v1.5 AI foundation: runs log, prompt registry, response cache, per-user quotas, learner state
-- Tables are admin-gated. Future feature migrations add their own tables on top.

create table if not exists public.ai_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  module text not null,
  model text not null,
  prompt_version text,
  input_hash text,
  tokens_in int,
  tokens_out int,
  latency_ms int,
  cost_cents numeric(10,4),
  status text not null default 'ok',
  error text,
  created_at timestamptz not null default now()
);
create index if not exists ai_runs_user_created_idx on public.ai_runs(user_id, created_at desc);
create index if not exists ai_runs_module_created_idx on public.ai_runs(module, created_at desc);

create table if not exists public.ai_cache (
  module text not null,
  input_hash text not null,
  output jsonb not null,
  model text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (module, input_hash)
);
create index if not exists ai_cache_expires_idx on public.ai_cache(expires_at);

create table if not exists public.ai_prompts (
  id uuid primary key default gen_random_uuid(),
  module text not null,
  version text not null,
  template text not null,
  active boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (module, version)
);
create index if not exists ai_prompts_module_active_idx on public.ai_prompts(module, active);

create table if not exists public.ai_quotas (
  user_id uuid not null references auth.users(id) on delete cascade,
  module text not null,
  period_start date not null default (current_date),
  used int not null default 0,
  daily_limit int not null default 100,
  updated_at timestamptz not null default now(),
  primary key (user_id, module, period_start)
);

create table if not exists public.learner_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  mastery jsonb not null default '{}'::jsonb,
  weak_tags text[] not null default '{}',
  recent_accuracy numeric(5,2),
  time_on_task_seconds int not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.ai_runs enable row level security;
alter table public.ai_cache enable row level security;
alter table public.ai_prompts enable row level security;
alter table public.ai_quotas enable row level security;
alter table public.learner_state enable row level security;

-- ai_runs: user sees own runs; admin sees all
create policy "ai_runs_select_own" on public.ai_runs for select
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "ai_runs_admin_all" on public.ai_runs for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ai_cache: admin only (server-side writes use service role)
create policy "ai_cache_admin_all" on public.ai_cache for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ai_prompts: admin manages; authenticated can read active rows
create policy "ai_prompts_read_active" on public.ai_prompts for select
  using (active = true or public.has_role(auth.uid(), 'admin'));
create policy "ai_prompts_admin_write" on public.ai_prompts for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ai_quotas: user reads own; admin reads/writes all
create policy "ai_quotas_select_own" on public.ai_quotas for select
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "ai_quotas_admin_all" on public.ai_quotas for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- learner_state: user reads own; linked parent reads; admin all
create policy "learner_state_select_own" on public.learner_state for select
  using (
    auth.uid() = user_id
    or public.has_role(auth.uid(), 'admin')
    or public.is_linked_parent(auth.uid(), user_id)
  );
create policy "learner_state_admin_all" on public.learner_state for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create trigger learner_state_set_updated_at
  before update on public.learner_state
  for each row execute function public.set_updated_at();

create trigger ai_quotas_set_updated_at
  before update on public.ai_quotas
  for each row execute function public.set_updated_at();