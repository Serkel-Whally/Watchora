-- Add a server-verified admin moderation workflow.
-- Assign admins by setting auth.users.raw_app_meta_data.role = 'admin' in Supabase.
drop policy if exists "Admins can review all submissions" on public.title_reviews;
create policy "Admins can review all submissions" on public.title_reviews
  for select using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can update moderation status" on public.title_reviews;
create policy "Admins can update moderation status" on public.title_reviews
  for update
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

grant update (status) on public.title_reviews to authenticated;
