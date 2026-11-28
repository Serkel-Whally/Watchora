-- Watchora streaming foundation
-- Provider credentials and signed playback URLs must remain server-side.
-- This schema stores provider references and short-lived session metadata only.

create extension if not exists pgcrypto;

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  title_id bigint not null,
  provider text not null check (length(provider) between 2 and 80),
  provider_asset_id text not null,
  status text not null default 'processing'
    check (status in ('pending', 'processing', 'ready', 'failed', 'disabled')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_asset_id)
);

create index if not exists media_assets_title_status_idx
  on public.media_assets (title_id, status);

create table if not exists public.rights_windows (
  id uuid primary key default gen_random_uuid(),
  media_asset_id uuid not null references public.media_assets(id) on delete cascade,
  territory_code text not null check (territory_code = 'WORLD' or territory_code ~ '^[A-Z]{2}$'),
  starts_at timestamptz not null,
  ends_at timestamptz,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'suspended', 'expired')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at)
);

create index if not exists rights_windows_asset_territory_idx
  on public.rights_windows (media_asset_id, territory_code, status, starts_at, ends_at);

create table if not exists public.playback_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title_id bigint not null,
  media_asset_id uuid not null references public.media_assets(id) on delete restrict,
  territory_code text not null check (territory_code = 'WORLD' or territory_code ~ '^[A-Z]{2}$'),
  provider_session_id text,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists playback_sessions_user_expiry_idx
  on public.playback_sessions (user_id, expires_at desc);

create index if not exists playback_sessions_asset_idx
  on public.playback_sessions (media_asset_id, created_at desc);

create table if not exists public.viewing_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  title_id bigint not null,
  position_seconds integer not null default 0 check (position_seconds >= 0),
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, title_id),
  check (duration_seconds = 0 or position_seconds <= duration_seconds)
);

create index if not exists viewing_progress_recent_idx
  on public.viewing_progress (user_id, updated_at desc);

alter table public.media_assets enable row level security;
alter table public.rights_windows enable row level security;
alter table public.playback_sessions enable row level security;
alter table public.viewing_progress enable row level security;

-- Media inventory, rights and session records are server-managed. No direct
-- browser grants are issued; trusted server routes use the service role.
revoke all on public.media_assets from anon, authenticated;
revoke all on public.rights_windows from anon, authenticated;
revoke all on public.playback_sessions from anon, authenticated;

-- Members can only read and maintain their own resume position.
grant select, insert, update, delete on public.viewing_progress to authenticated;

drop policy if exists "Members read own viewing progress" on public.viewing_progress;
create policy "Members read own viewing progress"
  on public.viewing_progress for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Members insert own viewing progress" on public.viewing_progress;
create policy "Members insert own viewing progress"
  on public.viewing_progress for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Members update own viewing progress" on public.viewing_progress;
create policy "Members update own viewing progress"
  on public.viewing_progress for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Members delete own viewing progress" on public.viewing_progress;
create policy "Members delete own viewing progress"
  on public.viewing_progress for delete
  to authenticated
  using (auth.uid() = user_id);

comment on table public.media_assets is
  'Private provider asset references. Never store public origin URLs or provider secrets here.';
comment on table public.rights_windows is
  'Server-enforced title distribution windows by territory.';
comment on table public.playback_sessions is
  'Server-managed playback audit records. Browser clients have no direct access.';
comment on table public.viewing_progress is
  'Member-owned resume positions synchronized across signed-in devices.';
