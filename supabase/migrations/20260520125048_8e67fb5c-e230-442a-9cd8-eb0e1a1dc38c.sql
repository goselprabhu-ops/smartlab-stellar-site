
-- Gamification engine schema

create type public.xp_kind as enum (
  'study', 'recall', 'quiz', 'mastery_up', 'streak_bonus',
  'daily_goal', 'challenge', 'achievement', 'remediation', 'manual'
);

create type public.challenge_kind as enum (
  'minutes', 'concepts', 'recall', 'quiz_score', 'streak', 'subject_focus', 'weakness_kill'
);

create type public.achievement_rarity as enum ('common', 'rare', 'epic', 'legendary');

-- XP ledger (immutable append-only)
create table public.xp_events (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null,
  kind public.xp_kind not null,
  points integer not null check (points >= 0 and points <= 5000),
  ref_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index xp_events_student_created on public.xp_events (student_id, created_at desc);
create index xp_events_kind on public.xp_events (kind);

alter table public.xp_events enable row level security;
create policy "xp_events_student_read" on public.xp_events for select using (auth.uid() = student_id);
create policy "xp_events_student_insert" on public.xp_events for insert with check (auth.uid() = student_id);
create policy "xp_events_admin_all" on public.xp_events for all using (has_role(auth.uid(), 'admin')) with check (has_role(auth.uid(), 'admin'));
create policy "xp_events_parent_read" on public.xp_events for select using (is_linked_parent(auth.uid(), student_id));

-- Aggregate engagement state (1 row per student)
create table public.student_engagement (
  student_id uuid primary key,
  total_xp integer not null default 0,
  level integer not null default 1,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_active_date date,
  daily_goal_minutes integer not null default 20,
  weekly_goal_xp integer not null default 700,
  burnout_score numeric not null default 0, -- 0..1
  motivation_profile text not null default 'balanced', -- ai-tuned: 'gentle' | 'balanced' | 'driven'
  freeze_credits integer not null default 2, -- streak freezes the AI can spend
  updated_at timestamptz not null default now()
);

alter table public.student_engagement enable row level security;
create policy "se_self_read" on public.student_engagement for select using (auth.uid() = student_id);
create policy "se_self_upsert" on public.student_engagement for insert with check (auth.uid() = student_id);
create policy "se_self_update" on public.student_engagement for update using (auth.uid() = student_id);
create policy "se_admin_all" on public.student_engagement for all using (has_role(auth.uid(), 'admin')) with check (has_role(auth.uid(), 'admin'));
create policy "se_parent_read" on public.student_engagement for select using (is_linked_parent(auth.uid(), student_id));

-- Achievement catalog (admin-managed)
create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  description text not null,
  icon text not null default 'trophy',
  category text not null default 'general',
  rarity public.achievement_rarity not null default 'common',
  xp_reward integer not null default 50,
  criteria jsonb not null default '{}'::jsonb,
  ai_generated boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.achievements enable row level security;
create policy "ach_public_read" on public.achievements for select using (active or has_role(auth.uid(), 'admin'));
create policy "ach_admin_write" on public.achievements for all using (has_role(auth.uid(), 'admin')) with check (has_role(auth.uid(), 'admin'));

-- Unlocked achievements
create table public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  progress jsonb not null default '{}'::jsonb,
  unlocked_at timestamptz not null default now(),
  unique (student_id, achievement_id)
);
create index ua_student on public.user_achievements (student_id, unlocked_at desc);

alter table public.user_achievements enable row level security;
create policy "ua_self_read" on public.user_achievements for select using (auth.uid() = student_id);
create policy "ua_self_insert" on public.user_achievements for insert with check (auth.uid() = student_id);
create policy "ua_admin_all" on public.user_achievements for all using (has_role(auth.uid(), 'admin')) with check (has_role(auth.uid(), 'admin'));
create policy "ua_parent_read" on public.user_achievements for select using (is_linked_parent(auth.uid(), student_id));

-- Daily goals
create table public.daily_goals (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null,
  goal_date date not null,
  target_minutes integer not null default 20,
  target_xp integer not null default 100,
  minutes_done integer not null default 0,
  xp_earned integer not null default 0,
  completed_at timestamptz,
  ai_message text,
  created_at timestamptz not null default now(),
  unique (student_id, goal_date)
);
create index dg_student_date on public.daily_goals (student_id, goal_date desc);

alter table public.daily_goals enable row level security;
create policy "dg_self_read" on public.daily_goals for select using (auth.uid() = student_id);
create policy "dg_self_insert" on public.daily_goals for insert with check (auth.uid() = student_id);
create policy "dg_self_update" on public.daily_goals for update using (auth.uid() = student_id);
create policy "dg_admin_all" on public.daily_goals for all using (has_role(auth.uid(), 'admin')) with check (has_role(auth.uid(), 'admin'));
create policy "dg_parent_read" on public.daily_goals for select using (is_linked_parent(auth.uid(), student_id));

-- Smart challenges (AI-generated or rule-based)
create table public.smart_challenges (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null,
  kind public.challenge_kind not null,
  title text not null,
  description text not null,
  target jsonb not null default '{}'::jsonb,
  progress jsonb not null default '{}'::jsonb,
  difficulty smallint not null default 2 check (difficulty between 1 and 5),
  xp_reward integer not null default 80,
  ai_rationale text,
  ai_generated boolean not null default true,
  expires_at timestamptz not null default (now() + interval '3 days'),
  completed_at timestamptz,
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);
create index sc_student_active on public.smart_challenges (student_id, expires_at desc) where completed_at is null;

alter table public.smart_challenges enable row level security;
create policy "sc_self_read" on public.smart_challenges for select using (auth.uid() = student_id);
create policy "sc_self_insert" on public.smart_challenges for insert with check (auth.uid() = student_id);
create policy "sc_self_update" on public.smart_challenges for update using (auth.uid() = student_id);
create policy "sc_admin_all" on public.smart_challenges for all using (has_role(auth.uid(), 'admin')) with check (has_role(auth.uid(), 'admin'));
create policy "sc_parent_read" on public.smart_challenges for select using (is_linked_parent(auth.uid(), student_id));

-- Leaderboard cohort (denormalized view-friendly table; refreshed lazily)
create table public.leaderboard_snapshots (
  id uuid primary key default gen_random_uuid(),
  scope text not null default 'global', -- 'class' | 'grade' | 'global'
  scope_key text not null default 'all', -- e.g. grade label
  period text not null default 'week',   -- 'day' | 'week' | 'month' | 'all'
  student_id uuid not null,
  display_name text not null,
  grade text,
  xp integer not null default 0,
  streak integer not null default 0,
  rank integer not null,
  generated_at timestamptz not null default now()
);
create index lb_scope on public.leaderboard_snapshots (scope, scope_key, period, rank);
create index lb_student on public.leaderboard_snapshots (student_id, generated_at desc);

alter table public.leaderboard_snapshots enable row level security;
create policy "lb_public_read" on public.leaderboard_snapshots for select using (auth.uid() is not null);
create policy "lb_admin_all" on public.leaderboard_snapshots for all using (has_role(auth.uid(), 'admin')) with check (has_role(auth.uid(), 'admin'));

-- Trigger to keep updated_at fresh
create trigger student_engagement_touch
before update on public.student_engagement
for each row execute function public.set_updated_at();

-- Seed achievement catalog
insert into public.achievements (code, title, description, icon, category, rarity, xp_reward, criteria) values
  ('first_steps', 'First Steps', 'Complete your first micro-concept', 'sparkles', 'onboarding', 'common', 25, '{"micro_concepts": 1}'),
  ('week_warrior', 'Week Warrior', 'Maintain a 7-day study streak', 'flame', 'streak', 'rare', 150, '{"streak": 7}'),
  ('month_master', 'Month Master', 'Maintain a 30-day study streak', 'flame', 'streak', 'epic', 600, '{"streak": 30}'),
  ('century_club', 'Century Club', 'Maintain a 100-day study streak', 'crown', 'streak', 'legendary', 2500, '{"streak": 100}'),
  ('recall_rookie', 'Recall Rookie', 'Score 80%+ on 5 recollection attempts', 'brain', 'recall', 'common', 80, '{"recall_high": 5}'),
  ('recall_machine', 'Recall Machine', 'Score 80%+ on 50 recollection attempts', 'brain', 'recall', 'epic', 500, '{"recall_high": 50}'),
  ('quiz_ace', 'Quiz Ace', 'Score 90%+ on 10 quizzes', 'target', 'quiz', 'rare', 200, '{"quiz_high": 10}'),
  ('weakness_slayer', 'Weakness Slayer', 'Convert 5 weak concepts to mastered', 'shield', 'mastery', 'rare', 250, '{"weakness_fixed": 5}'),
  ('subject_specialist', 'Subject Specialist', 'Reach 80%+ mastery in any subject', 'graduation-cap', 'mastery', 'epic', 400, '{"subject_mastery": 0.8}'),
  ('early_bird', 'Early Bird', 'Study before 8 AM five times', 'sunrise', 'habit', 'common', 75, '{"early_sessions": 5}'),
  ('night_owl', 'Night Owl', 'Study after 9 PM five times', 'moon', 'habit', 'common', 75, '{"late_sessions": 5}'),
  ('comeback_kid', 'Comeback Kid', 'Resume studying after a 7+ day break', 'rocket', 'resilience', 'rare', 120, '{"comeback_days": 7}'),
  ('xp_climber', 'XP Climber', 'Earn 1,000 lifetime XP', 'trending-up', 'xp', 'common', 50, '{"total_xp": 1000}'),
  ('xp_legend', 'XP Legend', 'Earn 10,000 lifetime XP', 'trophy', 'xp', 'legendary', 1000, '{"total_xp": 10000}'),
  ('daily_doer', 'Daily Doer', 'Hit your daily goal 10 times', 'check-circle', 'goal', 'common', 100, '{"goals_hit": 10}'),
  ('challenge_champ', 'Challenge Champion', 'Complete 10 smart challenges', 'swords', 'challenge', 'rare', 200, '{"challenges_done": 10}');
