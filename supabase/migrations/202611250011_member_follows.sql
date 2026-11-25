-- Member-to-member follows and a private-to-member following feed.
create table if not exists public.member_follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint member_follows_not_self check (follower_id <> following_id)
);

create index if not exists member_follows_following_idx
  on public.member_follows(following_id, created_at desc);

alter table public.member_follows enable row level security;
revoke all on public.member_follows from anon, authenticated;
grant select, insert, delete on public.member_follows to authenticated;

drop policy if exists "Members can read their own follow graph" on public.member_follows;
create policy "Members can read their own follow graph"
  on public.member_follows for select to authenticated
  using (auth.uid() = follower_id or auth.uid() = following_id);

drop policy if exists "Members can follow others" on public.member_follows;
create policy "Members can follow others"
  on public.member_follows for insert to authenticated
  with check (auth.uid() = follower_id and follower_id <> following_id);

drop policy if exists "Members can unfollow others" on public.member_follows;
create policy "Members can unfollow others"
  on public.member_follows for delete to authenticated
  using (auth.uid() = follower_id);

create or replace function public.get_member_follow_stats(p_member_id uuid)
returns table(followers_count bigint, following_count bigint, viewer_follows boolean)
language sql
stable
security definer
set search_path = public
as $$
  select
    (select count(*) from public.member_follows f where f.following_id = p_member_id),
    (select count(*) from public.member_follows f where f.follower_id = p_member_id),
    exists(select 1 from public.member_follows f where f.follower_id = auth.uid() and f.following_id = p_member_id);
$$;

create or replace function public.get_following_activity(p_limit integer default 30)
returns table(
  review_id uuid,
  title_id bigint,
  member_id uuid,
  display_name text,
  rating smallint,
  review_body text,
  contains_spoilers boolean,
  helpful_votes bigint,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    r.id,
    r.title_id,
    p.id,
    p.display_name,
    r.rating,
    case when r.contains_spoilers then null else r.body end,
    r.contains_spoilers,
    count(v.id)::bigint,
    r.created_at
  from public.title_reviews r
  join public.profiles p on p.id = r.user_id
  join public.member_follows f on f.following_id = r.user_id and f.follower_id = auth.uid()
  left join public.review_helpful_votes v on v.review_id = r.id
  where auth.uid() is not null and r.status = 'approved'
  group by r.id, p.id, p.display_name
  order by r.created_at desc
  limit greatest(1, least(coalesce(p_limit, 30), 50));
$$;

revoke all on function public.get_member_follow_stats(uuid) from public;
grant execute on function public.get_member_follow_stats(uuid) to authenticated;
revoke all on function public.get_following_activity(integer) from public;
grant execute on function public.get_following_activity(integer) to authenticated;
