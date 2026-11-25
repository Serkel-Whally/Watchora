-- Member reporting for approved community reviews.
create table if not exists public.review_reports (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.title_reviews(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (reason in ('harassment','hate','spam','spoilers','misinformation','other')),
  details text check (details is null or char_length(details) <= 500),
  status text not null default 'open' check (status in ('open','resolved','dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique (review_id, reporter_id)
);

create index if not exists review_reports_status_created_idx
  on public.review_reports(status, created_at);

alter table public.review_reports enable row level security;
revoke all on public.review_reports from anon, authenticated;
grant select, insert on public.review_reports to authenticated;
grant update (status, resolved_at) on public.review_reports to authenticated;

drop policy if exists "Members can report approved reviews" on public.review_reports;
create policy "Members can report approved reviews" on public.review_reports
  for insert to authenticated
  with check (
    reporter_id = auth.uid()
    and exists (
      select 1 from public.title_reviews r
      where r.id = review_id and r.status = 'approved' and r.user_id <> auth.uid()
    )
  );

drop policy if exists "Admins can read review reports" on public.review_reports;
create policy "Admins can read review reports" on public.review_reports
  for select to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can update review reports" on public.review_reports;
create policy "Admins can update review reports" on public.review_reports
  for update to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
