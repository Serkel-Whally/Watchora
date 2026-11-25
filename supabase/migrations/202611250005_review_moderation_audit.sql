-- Append-only moderator audit trail and atomic report actions.
create table if not exists public.review_moderation_audit (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references public.review_reports(id) on delete set null,
  review_id uuid references public.title_reviews(id) on delete set null,
  moderator_id uuid not null references auth.users(id) on delete restrict,
  action text not null check (action in ('resolved_report','dismissed_report','rejected_review')),
  previous_review_status text,
  new_review_status text,
  created_at timestamptz not null default now()
);

create index if not exists review_moderation_audit_created_idx
  on public.review_moderation_audit(created_at desc);
create index if not exists review_moderation_audit_report_idx
  on public.review_moderation_audit(report_id);

alter table public.review_moderation_audit enable row level security;
revoke all on public.review_moderation_audit from anon, authenticated;
grant select on public.review_moderation_audit to authenticated;
drop policy if exists "Admins can read moderation audit" on public.review_moderation_audit;
create policy "Admins can read moderation audit" on public.review_moderation_audit
  for select to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create or replace function public.admin_process_review_report(p_report_id uuid, p_action text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_report public.review_reports%rowtype;
  v_review public.title_reviews%rowtype;
  v_audit_action text;
begin
  if auth.uid() is null or (auth.jwt() -> 'app_metadata' ->> 'role') is distinct from 'admin' then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  if p_action is null or p_action not in ('resolve','dismiss','reject_review') then
    raise exception 'Invalid moderation action' using errcode = '22023';
  end if;

  select * into v_report
  from public.review_reports
  where id = p_report_id
  for update;

  if not found or v_report.status <> 'open' then
    raise exception 'Report is no longer open' using errcode = 'P0002';
  end if;

  select * into v_review
  from public.title_reviews
  where id = v_report.review_id
  for update;

  if not found then
    raise exception 'Reported review no longer exists' using errcode = 'P0002';
  end if;

  if p_action = 'reject_review' then
    if v_review.status <> 'approved' then
      raise exception 'Only an approved review can be removed from public view' using errcode = '22023';
    end if;
    update public.title_reviews set status = 'rejected' where id = v_review.id;
    update public.review_reports set status = 'resolved', resolved_at = now() where id = v_report.id;
    v_audit_action := 'rejected_review';
  elsif p_action = 'resolve' then
    update public.review_reports set status = 'resolved', resolved_at = now() where id = v_report.id;
    v_audit_action := 'resolved_report';
  else
    update public.review_reports set status = 'dismissed', resolved_at = now() where id = v_report.id;
    v_audit_action := 'dismissed_report';
  end if;

  insert into public.review_moderation_audit
    (report_id, review_id, moderator_id, action, previous_review_status, new_review_status)
  values
    (v_report.id, v_review.id, auth.uid(), v_audit_action, v_review.status,
     case when p_action = 'reject_review' then 'rejected' else v_review.status end);

  return jsonb_build_object('updated', true, 'action', v_audit_action);
end;
$$;

revoke all on function public.admin_process_review_report(uuid, text) from public, anon;
grant execute on function public.admin_process_review_report(uuid, text) to authenticated;
