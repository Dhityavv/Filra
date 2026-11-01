create table if not exists public.favorite_movies (
  clerk_user_id text not null references public.profiles(clerk_user_id) on delete cascade,
  movie_id bigint not null,
  movie jsonb not null,
  favorited_at timestamptz not null default now(),
  primary key (clerk_user_id, movie_id)
);

create index if not exists favorite_movies_user_recent
  on public.favorite_movies (clerk_user_id, favorited_at desc);

alter table public.favorite_movies enable row level security;

drop policy if exists "Users manage their own favorite movies" on public.favorite_movies;
create policy "Users manage their own favorite movies" on public.favorite_movies
  for all using (clerk_user_id = (auth.jwt() ->> 'sub'))
  with check (clerk_user_id = (auth.jwt() ->> 'sub'));

notify pgrst, 'reload schema';
