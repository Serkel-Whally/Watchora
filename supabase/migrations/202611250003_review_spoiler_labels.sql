-- Add spoiler labelling to community reviews. Existing reviews default to non-spoiler.
alter table public.title_reviews
  add column if not exists contains_spoilers boolean not null default false;
