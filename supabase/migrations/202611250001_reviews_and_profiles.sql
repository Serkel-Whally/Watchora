-- Watchora community reviews. Apply this migration in the Supabase SQL editor.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Watchora member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.title_reviews (
  id uuid primary key default gen_random_uuid(),
  title_id bigint not null check (title_id > 0),
  user_id uuid not null references auth.users(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  body text not null check (char_length(trim(body)) between 12 and 1000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (title_id, user_id)
);

alter table public.title_reviews drop constraint if exists title_reviews_profile_fk;
alter table public.title_reviews add constraint title_reviews_profile_fk
  foreign key (user_id) references public.profiles(id) on delete cascade;

create index if not exists title_reviews_public_idx
  on public.title_reviews (title_id, created_at desc) where status = 'approved';
create index if not exists title_reviews_owner_idx
  on public.title_reviews (user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.title_reviews enable row level security;

drop policy if exists "Profiles are publicly readable" on public.profiles;
create policy "Profiles are publicly readable" on public.profiles
  for select using (true);
drop policy if exists "Users create their own profile" on public.profiles;
create policy "Users create their own profile" on public.profiles
  for insert with check (auth.uid() = id);
drop policy if exists "Users update their own profile" on public.profiles;
create policy "Users update their own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Approved reviews are public; owners can read theirs" on public.title_reviews;
create policy "Approved reviews are public; owners can read theirs" on public.title_reviews
  for select using (status = 'approved' or auth.uid() = user_id);
drop policy if exists "Signed-in users submit their own pending reviews" on public.title_reviews;
create policy "Signed-in users submit their own pending reviews" on public.title_reviews
  for insert with check (auth.uid() = user_id and status = 'pending');
drop policy if exists "Owners can delete their own reviews" on public.title_reviews;
create policy "Owners can delete their own reviews" on public.title_reviews
  for delete using (auth.uid() = user_id);

-- Users cannot self-approve or edit ratings/status. Moderation is performed from
-- the Supabase dashboard by a trusted project operator, never from the public client.
revoke update on public.title_reviews from anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant insert, update on public.profiles to authenticated;
grant select, insert, delete on public.title_reviews to authenticated;
grant select on public.title_reviews to anon;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), 'Watchora member')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
