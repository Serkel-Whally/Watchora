-- Cross-device watchlists for authenticated members.
-- Guest watchlists remain in browser storage and are merged on first signed-in visit.
create table if not exists public.user_watchlist (
  user_id uuid not null references auth.users(id) on delete cascade,
  title_id bigint not null check (title_id > 0),
  created_at timestamptz not null default now(),
  primary key (user_id, title_id)
);

create index if not exists user_watchlist_owner_created_idx
  on public.user_watchlist (user_id, created_at desc);

alter table public.user_watchlist enable row level security;

drop policy if exists "Members read their own watchlist" on public.user_watchlist;
create policy "Members read their own watchlist"
  on public.user_watchlist for select
  using (auth.uid() = user_id);

drop policy if exists "Members add to their own watchlist" on public.user_watchlist;
create policy "Members add to their own watchlist"
  on public.user_watchlist for insert
  with check (auth.uid() = user_id);

drop policy if exists "Members remove from their own watchlist" on public.user_watchlist;
create policy "Members remove from their own watchlist"
  on public.user_watchlist for delete
  using (auth.uid() = user_id);

revoke all on public.user_watchlist from anon;
revoke update on public.user_watchlist from anon, authenticated;
grant select, insert, delete on public.user_watchlist to authenticated;
