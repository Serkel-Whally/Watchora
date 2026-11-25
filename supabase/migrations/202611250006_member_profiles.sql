-- Public member profiles expose only display_name and bio; auth emails remain private.
alter table public.profiles
  add column if not exists bio text not null default '';

alter table public.profiles
  add constraint profiles_display_name_length check (char_length(trim(display_name)) between 2 and 40),
  add constraint profiles_bio_length check (char_length(bio) <= 240);

create index if not exists title_reviews_member_history_idx
  on public.title_reviews (user_id, created_at desc);
