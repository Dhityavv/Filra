create table if not exists public.profiles (
  clerk_user_id text primary key,
  username text not null unique,
  display_name text not null default '',
  bio text not null default '',
  website_url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (username ~ '^[a-z0-9_]{3,24}$'),
  constraint profiles_bio_length check (char_length(bio) <= 300)
);

create table if not exists public.movie_ratings (
  clerk_user_id text not null references public.profiles(clerk_user_id) on delete cascade,
  movie_id bigint not null,
  movie jsonb not null,
  score smallint not null check (score between 1 and 10),
  review text not null default '' check (char_length(review) <= 500),
  updated_at timestamptz not null default now(),
  primary key (clerk_user_id, movie_id)
);

create table if not exists public.watchlist (
  clerk_user_id text not null references public.profiles(clerk_user_id) on delete cascade,
  movie_id bigint not null,
  movie jsonb not null,
  added_at timestamptz not null default now(),
  primary key (clerk_user_id, movie_id)
);

create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id text not null references public.profiles(clerk_user_id) on delete cascade,
  recipient_id text not null references public.profiles(clerk_user_id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  constraint friend_requests_not_self check (requester_id <> recipient_id),
  constraint friend_requests_unique_pair unique (requester_id, recipient_id)
);

create index if not exists profiles_username_search on public.profiles (username);
create index if not exists profiles_display_name_search on public.profiles (display_name);
create index if not exists movie_ratings_user_recent on public.movie_ratings (clerk_user_id, updated_at desc);
create index if not exists friend_requests_recipient on public.friend_requests (recipient_id, status);
create index if not exists friend_requests_requester on public.friend_requests (requester_id, status);
create unique index if not exists friend_requests_unordered_pair
  on public.friend_requests (least(requester_id, recipient_id), greatest(requester_id, recipient_id));

alter table public.profiles enable row level security;
alter table public.movie_ratings enable row level security;
alter table public.watchlist enable row level security;
alter table public.friend_requests enable row level security;

drop policy if exists "Profiles are publicly readable" on public.profiles;
drop policy if exists "Ratings are publicly readable" on public.movie_ratings;
drop policy if exists "Users manage their own ratings" on public.movie_ratings;
drop policy if exists "Users manage their own watchlist" on public.watchlist;
drop policy if exists "Users manage their own friend requests" on public.friend_requests;

create policy "Profiles are publicly readable" on public.profiles
  for select using (true);
create policy "Ratings are publicly readable" on public.movie_ratings
  for select using (true);
create policy "Users manage their own ratings" on public.movie_ratings
  for all using (clerk_user_id = (auth.jwt() ->> 'sub'))
  with check (clerk_user_id = (auth.jwt() ->> 'sub'));
create policy "Users manage their own watchlist" on public.watchlist
  for all using (clerk_user_id = (auth.jwt() ->> 'sub'))
  with check (clerk_user_id = (auth.jwt() ->> 'sub'));
create policy "Users manage their own friend requests" on public.friend_requests
  for all using (requester_id = (auth.jwt() ->> 'sub') or recipient_id = (auth.jwt() ->> 'sub'))
  with check (requester_id = (auth.jwt() ->> 'sub') or recipient_id = (auth.jwt() ->> 'sub'));
