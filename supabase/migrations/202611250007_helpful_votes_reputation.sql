-- Helpful votes and transparent, activity-based reviewer reputation.
create table if not exists public.review_helpful_votes (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.title_reviews(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (review_id, user_id)
);

create index if not exists review_helpful_votes_review_idx
  on public.review_helpful_votes(review_id);

alter table public.review_helpful_votes enable row level security;
revoke all on public.review_helpful_votes from anon, authenticated;
-- Voters are deliberately private; all access is through narrowly scoped functions.

create or replace function public.get_review_helpful_counts(p_review_ids uuid[])
returns table(review_id uuid, helpful_count bigint, viewer_voted boolean)
language sql
stable
security definer
set search_path = public
as $$
  select r.id,
    count(v.id)::bigint as helpful_count,
    coalesce(bool_or(v.user_id = auth.uid()), false) as viewer_voted
  from public.title_reviews r
  left join public.review_helpful_votes v on v.review_id = r.id
  where r.id = any(coalesce(p_review_ids, array[]::uuid[]))
    and r.status = 'approved'
  group by r.id;
$$;

create or replace function public.toggle_review_helpful_vote(p_review_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_voted boolean;
  v_count bigint;
begin
  if auth.uid() is null then
    raise exception 'Sign in required' using errcode = '42501';
  end if;

  select user_id into v_owner
  from public.title_reviews
  where id = p_review_id and status = 'approved'
  for share;

  if not found then
    raise exception 'Review not found' using errcode = 'P0002';
  end if;
  if v_owner = auth.uid() then
    raise exception 'You cannot vote for your own review' using errcode = '22023';
  end if;

  delete from public.review_helpful_votes
  where review_id = p_review_id and user_id = auth.uid();

  if found then
    v_voted := false;
  else
    insert into public.review_helpful_votes(review_id, user_id)
    values (p_review_id, auth.uid())
    on conflict (review_id, user_id) do nothing;
    v_voted := true;
  end if;

  select count(*) into v_count
  from public.review_helpful_votes
  where review_id = p_review_id;

  return jsonb_build_object('review_id', p_review_id, 'helpful_count', v_count, 'viewer_voted', v_voted);
end;
$$;

create or replace function public.get_member_reputation(p_member_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'approved_reviews', count(distinct r.id),
    'helpful_votes', count(v.id)
  )
  from public.title_reviews r
  left join public.review_helpful_votes v on v.review_id = r.id
  where r.user_id = p_member_id and r.status = 'approved';
$$;

create or replace function public.get_community_members(p_limit integer default 20)
returns table(member_id uuid, display_name text, bio text, approved_reviews bigint, helpful_votes bigint)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.display_name, p.bio,
    count(distinct r.id)::bigint as approved_reviews,
    count(v.id)::bigint as helpful_votes
  from public.profiles p
  join public.title_reviews r on r.user_id = p.id and r.status = 'approved'
  left join public.review_helpful_votes v on v.review_id = r.id
  group by p.id, p.display_name, p.bio
  order by count(v.id) desc, count(distinct r.id) desc, p.display_name asc
  limit greatest(1, least(coalesce(p_limit, 20), 50));
$$;

revoke all on function public.get_review_helpful_counts(uuid[]) from public;
revoke all on function public.toggle_review_helpful_vote(uuid) from public, anon;
revoke all on function public.get_member_reputation(uuid) from public;
revoke all on function public.get_community_members(integer) from public;
grant execute on function public.get_review_helpful_counts(uuid[]) to anon, authenticated;
grant execute on function public.toggle_review_helpful_vote(uuid) to authenticated;
grant execute on function public.get_member_reputation(uuid) to anon, authenticated;
grant execute on function public.get_community_members(integer) to anon, authenticated;
