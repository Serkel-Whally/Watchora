-- Private member notifications for review decisions and helpful votes.
create table if not exists public.member_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  notification_type text not null check (notification_type in ('review_approved','review_rejected','review_helpful')),
  title_id bigint not null check (title_id > 0),
  review_id uuid references public.title_reviews(id) on delete set null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  unique (user_id, notification_type, review_id, actor_id)
);

create index if not exists member_notifications_owner_created_idx
  on public.member_notifications(user_id, created_at desc);
create index if not exists member_notifications_unread_idx
  on public.member_notifications(user_id, created_at desc) where read_at is null;

alter table public.member_notifications enable row level security;
revoke all on public.member_notifications from anon, authenticated;
grant select on public.member_notifications to authenticated;
grant update (read_at) on public.member_notifications to authenticated;

drop policy if exists "Members read their own notifications" on public.member_notifications;
create policy "Members read their own notifications"
  on public.member_notifications for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Members mark their own notifications read" on public.member_notifications;
create policy "Members mark their own notifications read"
  on public.member_notifications for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.notify_review_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status is distinct from new.status and new.status in ('approved','rejected') then
    insert into public.member_notifications
      (user_id, notification_type, title_id, review_id)
    values
      (new.user_id,
       case when new.status = 'approved' then 'review_approved' else 'review_rejected' end,
       new.title_id, new.id)
    on conflict (user_id, notification_type, review_id, actor_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists title_review_status_notification on public.title_reviews;
create trigger title_review_status_notification
  after update of status on public.title_reviews
  for each row execute function public.notify_review_status_change();

create or replace function public.notify_review_helpful_vote()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_review public.title_reviews%rowtype;
begin
  select * into v_review
  from public.title_reviews
  where id = new.review_id and status = 'approved';
  if found and v_review.user_id <> new.user_id then
    insert into public.member_notifications
      (user_id, actor_id, notification_type, title_id, review_id)
    values
      (v_review.user_id, new.user_id, 'review_helpful', v_review.title_id, v_review.id)
    on conflict (user_id, notification_type, review_id, actor_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists review_helpful_vote_notification on public.review_helpful_votes;
create trigger review_helpful_vote_notification
  after insert on public.review_helpful_votes
  for each row execute function public.notify_review_helpful_vote();

revoke all on function public.notify_review_status_change() from public, anon, authenticated;
revoke all on function public.notify_review_helpful_vote() from public, anon, authenticated;
