-- Notify review owners and comment authors after a new comment is approved.
alter table public.member_notifications
  drop constraint if exists member_notifications_notification_type_check;

alter table public.member_notifications
  add constraint member_notifications_notification_type_check
  check (notification_type in (
    'review_approved', 'review_rejected', 'review_helpful',
    'review_comment', 'review_reply'
  ));

alter table public.member_notifications
  add column if not exists comment_id uuid
  references public.review_comments(id) on delete cascade;

-- Replace the original uniqueness rule so repeated comments by one member
-- on the same review can each produce their own event.
alter table public.member_notifications
  drop constraint if exists member_notifications_user_id_notification_type_review_id_actor_id_key;

create unique index if not exists member_notifications_legacy_event_unique
  on public.member_notifications(user_id, notification_type, review_id, actor_id)
  where comment_id is null;

create unique index if not exists member_notifications_comment_event_unique
  on public.member_notifications(user_id, notification_type, comment_id)
  where comment_id is not null;

create or replace function public.notify_approved_review_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_review public.title_reviews%rowtype;
  v_parent_author uuid;
begin
  if old.status is distinct from new.status and new.status = 'approved' then
    select * into v_review
    from public.title_reviews
    where id = new.review_id and status = 'approved';

    if not found then
      return new;
    end if;

    if new.parent_id is null then
      if v_review.user_id <> new.author_id then
        insert into public.member_notifications
          (user_id, actor_id, notification_type, title_id, review_id, comment_id)
        values
          (v_review.user_id, new.author_id, 'review_comment',
           v_review.title_id, v_review.id, new.id)
        on conflict do nothing;
      end if;
    else
      select author_id into v_parent_author
      from public.review_comments
      where id = new.parent_id and status = 'approved';

      if v_parent_author is not null and v_parent_author <> new.author_id then
        insert into public.member_notifications
          (user_id, actor_id, notification_type, title_id, review_id, comment_id)
        values
          (v_parent_author, new.author_id, 'review_reply',
           v_review.title_id, v_review.id, new.id)
        on conflict do nothing;
      end if;

      if v_review.user_id <> new.author_id
         and v_review.user_id is distinct from v_parent_author then
        insert into public.member_notifications
          (user_id, actor_id, notification_type, title_id, review_id, comment_id)
        values
          (v_review.user_id, new.author_id, 'review_comment',
           v_review.title_id, v_review.id, new.id)
        on conflict do nothing;
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists review_comment_approved_notification on public.review_comments;
create trigger review_comment_approved_notification
  after update of status on public.review_comments
  for each row execute function public.notify_approved_review_comment();

revoke all on function public.notify_approved_review_comment() from public, anon, authenticated;
