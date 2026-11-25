-- Safe, read-only public activity feed for approved community reviews.
-- Spoiler-marked review text is never returned by this function.
create index if not exists title_reviews_activity_idx
  on public.title_reviews (created_at desc)
  where status = 'approved';

create or replace function public.get_community_activity(p_limit integer default 20)
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
  left join public.review_helpful_votes v on v.review_id = r.id
  where r.status = 'approved'
  group by r.id, p.id, p.display_name
  order by r.created_at desc
  limit greatest(1, least(coalesce(p_limit, 20), 50));
$$;

revoke all on function public.get_community_activity(integer) from public;
grant execute on function public.get_community_activity(integer) to anon, authenticated;
