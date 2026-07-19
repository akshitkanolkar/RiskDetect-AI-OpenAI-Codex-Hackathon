-- RiskDetect AI MVP Schema
-- Run in Supabase SQL Editor or via CLI

create extension if not exists "pgcrypto";

-- Risk level enum-like check via text + check constraint

create table if not exists public.url_scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  url text not null,
  normalized_url text not null,
  domain text not null,
  protocol text not null,
  status text not null default 'completed'
    check (status in ('pending', 'running', 'completed', 'failed')),
  risk_level text not null default 'safe'
    check (risk_level in ('safe', 'low', 'medium', 'high', 'critical')),
  risk_score integer not null default 0 check (risk_score between 0 and 100),
  confidence integer not null default 0 check (confidence between 0 and 100),
  threat_category text not null default 'unknown',
  reasons jsonb not null default '[]'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  ai_explanation text not null default '',
  timeline jsonb not null default '[]'::jsonb,
  signals jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.image_scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  mime_type text not null,
  file_size integer not null default 0,
  status text not null default 'completed'
    check (status in ('pending', 'running', 'completed', 'failed')),
  risk_level text not null default 'safe'
    check (risk_level in ('safe', 'low', 'medium', 'high', 'critical')),
  risk_score integer not null default 0 check (risk_score between 0 and 100),
  confidence integer not null default 0 check (confidence between 0 and 100),
  extracted_text text not null default '',
  findings jsonb not null default '[]'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  ai_explanation text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Security Copilot',
  context_scan_ids jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.risk_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scan_id uuid,
  scan_type text not null check (scan_type in ('url', 'image')),
  risk_level text not null
    check (risk_level in ('safe', 'low', 'medium', 'high', 'critical')),
  risk_score integer not null check (risk_score between 0 and 100),
  recorded_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_url_scans_user_created
  on public.url_scans (user_id, created_at desc)
  where deleted_at is null;

create index if not exists idx_image_scans_user_created
  on public.image_scans (user_id, created_at desc)
  where deleted_at is null;

create index if not exists idx_chat_sessions_user
  on public.chat_sessions (user_id, updated_at desc)
  where deleted_at is null;

create index if not exists idx_chat_messages_session
  on public.chat_messages (session_id, created_at asc)
  where deleted_at is null;

create index if not exists idx_risk_history_user_recorded
  on public.risk_history (user_id, recorded_at desc)
  where deleted_at is null;

alter table public.url_scans enable row level security;
alter table public.image_scans enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.risk_history enable row level security;

create policy "url_scans_select_own" on public.url_scans
  for select using (auth.uid() = user_id and deleted_at is null);
create policy "url_scans_insert_own" on public.url_scans
  for insert with check (auth.uid() = user_id);
create policy "url_scans_update_own" on public.url_scans
  for update using (auth.uid() = user_id);

create policy "image_scans_select_own" on public.image_scans
  for select using (auth.uid() = user_id and deleted_at is null);
create policy "image_scans_insert_own" on public.image_scans
  for insert with check (auth.uid() = user_id);
create policy "image_scans_update_own" on public.image_scans
  for update using (auth.uid() = user_id);

create policy "chat_sessions_select_own" on public.chat_sessions
  for select using (auth.uid() = user_id and deleted_at is null);
create policy "chat_sessions_insert_own" on public.chat_sessions
  for insert with check (auth.uid() = user_id);
create policy "chat_sessions_update_own" on public.chat_sessions
  for update using (auth.uid() = user_id);

create policy "chat_messages_select_own" on public.chat_messages
  for select using (auth.uid() = user_id and deleted_at is null);
create policy "chat_messages_insert_own" on public.chat_messages
  for insert with check (auth.uid() = user_id);

create policy "risk_history_select_own" on public.risk_history
  for select using (auth.uid() = user_id and deleted_at is null);
create policy "risk_history_insert_own" on public.risk_history
  for insert with check (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_url_scans_updated on public.url_scans;
create trigger trg_url_scans_updated
  before update on public.url_scans
  for each row execute function public.set_updated_at();

drop trigger if exists trg_image_scans_updated on public.image_scans;
create trigger trg_image_scans_updated
  before update on public.image_scans
  for each row execute function public.set_updated_at();

drop trigger if exists trg_chat_sessions_updated on public.chat_sessions;
create trigger trg_chat_sessions_updated
  before update on public.chat_sessions
  for each row execute function public.set_updated_at();
