-- Moderated, one-level threaded discussion beneath approved title reviews.
create table if not exists public.review_comments (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.title_reviews(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid,
  body text not null check (char_length(btrim(body)) between 2 and 600),
  contains_spoilers boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  constraint review_comments_id_review_unique unique (id, review_id),
  constraint review_comments_parent_same_review_fk
    foreign key (parent_id, review_id)
    references public.review_comments(id, review_id)
    on delete cascade,
  constraint review_comments_no_self_parent check (parent_id is null or parent_id <> id)
);

create index if not exists review_comments_public_idx
  on public.review_comments(review_id, created_at asc)
  where status = 'approved';
create index if not exists review_comments_pending_idx
  on public.review_comments(created_at asc)
  where status = 'pending';
create index if not exists review_comments_author_idx
  on public.review_comments(author_id, created_at desc);

alter table public.review_comments enable row level security;
revoke all on public.review_comments from anon, authenticated;
grant select, insert, delete on public.review_comments to authenticated;
grant update (status) on public.review_comments to authenticated;

drop policy if exists "Members can read approved or own comments" on public.review_comments;
create policy "Members can read approved or own comments"
  on public.review_comments for select to authenticated
  using (
    status = 'approved'
    or author_id = auth.uid()
    or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

drop policy if exists "Members can add moderated comments" on public.review_comments;
create policy "Members can add moderated comments"
  on public.review_comments for insert to authenticated
  with check (
    author_id = auth.uid()
    and status = 'pending'
    and exists (
      select 1 from public.title_reviews r
      where r.id = review_id and r.status = 'approved'
    )
    and (
      parent_id is null
      or exists (
        select 1 from public.review_comments parent
        where parent.id = parent_id
          and parent.review_id = review_comments.review_id
          and parent.parent_id is null
          and parent.status = 'approved'
      )
    )
  );

drop policy if exists "Members can remove pending own comments" on public.review_comments;
create policy "Members can remove pending own comments"
  on public.review_comments for delete to authenticated
  using (author_id = auth.uid() and status = 'pending');

drop policy if exists "Admins can moderate comments" on public.review_comments;
create policy "Admins can moderate comments"
  on public.review_comments for update to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
