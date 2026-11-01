create table if not exists public.arcade_profiles (
  clerk_user_id text primary key,
  xp bigint not null default 0 check (xp >= 0),
  level integer not null default 1 check (level >= 1),
  current_streak integer not null default 0 check (current_streak >= 0),
  best_streak integer not null default 0 check (best_streak >= 0),
  last_played_on date,
  games_played integer not null default 0 check (games_played >= 0),
  wins integer not null default 0 check (wins >= 0),
  correct_answers integer not null default 0 check (correct_answers >= 0),
  questions_answered integer not null default 0 check (questions_answered >= 0),
  updated_at timestamptz not null default now()
);

alter table public.arcade_profiles
  add column if not exists questions_answered integer not null default 0;

create table if not exists public.arcade_game_sessions (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text,
  game_key text not null check (game_key in ('guess-movie', 'trivia', 'higher-lower', 'emoji', 'movie-wordle')),
  mode text not null,
  game_state jsonb not null,
  state_version integer not null default 0,
  status text not null default 'active' check (status in ('active', 'completed', 'expired')),
  score integer not null default 0 check (score >= 0),
  correct_answers integer not null default 0 check (correct_answers >= 0),
  total_questions integer not null default 0 check (total_questions >= 0),
  daily_challenge_date date,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.arcade_scores (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.arcade_game_sessions(id) on delete cascade,
  clerk_user_id text not null,
  game_key text not null,
  mode text not null,
  score integer not null check (score >= 0),
  correct_answers integer not null check (correct_answers >= 0),
  total_questions integer not null check (total_questions >= 0),
  xp_earned integer not null check (xp_earned >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.arcade_game_stats (
  clerk_user_id text not null,
  game_key text not null check (game_key in ('guess-movie', 'trivia', 'higher-lower', 'emoji', 'movie-wordle')),
  games_played integer not null default 0 check (games_played >= 0),
  wins integer not null default 0 check (wins >= 0),
  high_score integer not null default 0 check (high_score >= 0),
  score_total bigint not null default 0 check (score_total >= 0),
  correct_answers integer not null default 0 check (correct_answers >= 0),
  questions_answered integer not null default 0 check (questions_answered >= 0),
  updated_at timestamptz not null default now(),
  primary key (clerk_user_id, game_key)
);

create table if not exists public.arcade_achievements (
  clerk_user_id text not null,
  achievement_key text not null,
  earned_at timestamptz not null default now(),
  primary key (clerk_user_id, achievement_key)
);

create table if not exists public.arcade_daily_challenges (
  challenge_date date not null,
  game_key text not null check (game_key in ('guess-movie', 'trivia', 'emoji', 'movie-wordle')),
  challenge_payload jsonb not null,
  created_at timestamptz not null default now(),
  primary key (challenge_date, game_key)
);

create table if not exists public.arcade_question_rotations (
  owner_key text not null,
  game_key text not null check (game_key in ('guess-movie', 'trivia', 'higher-lower', 'emoji', 'movie-wordle')),
  seen_ids jsonb not null default '{}'::jsonb check (jsonb_typeof(seen_ids) = 'object'),
  updated_at timestamptz not null default now(),
  primary key (owner_key, game_key)
);

create table if not exists public.arcade_daily_completions (
  clerk_user_id text not null,
  challenge_date date not null,
  game_key text not null,
  session_id uuid not null unique references public.arcade_game_sessions(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (clerk_user_id, challenge_date, game_key)
);

create index if not exists arcade_scores_player_recent
  on public.arcade_scores (clerk_user_id, created_at desc);
create index if not exists arcade_scores_leaderboard_weekly
  on public.arcade_scores (created_at desc, xp_earned desc);
create index if not exists arcade_sessions_player_recent
  on public.arcade_game_sessions (clerk_user_id, started_at desc);

alter table public.arcade_profiles enable row level security;
alter table public.arcade_game_sessions enable row level security;
alter table public.arcade_scores enable row level security;
alter table public.arcade_game_stats enable row level security;
alter table public.arcade_achievements enable row level security;
alter table public.arcade_daily_challenges enable row level security;
alter table public.arcade_question_rotations enable row level security;
alter table public.arcade_daily_completions enable row level security;

create or replace function public.record_arcade_completion(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  session_row public.arcade_game_sessions%rowtype;
  player_row public.arcade_profiles%rowtype;
  existing_score public.arcade_scores%rowtype;
  earned_xp integer;
  next_streak integer;
  last_played_date date;
begin
  select * into session_row
  from public.arcade_game_sessions
  where id = p_session_id
  for update;

  if not found or session_row.status <> 'completed' or session_row.clerk_user_id is null then
    raise exception 'Arcade session is not eligible for progression';
  end if;

  select * into existing_score
  from public.arcade_scores
  where session_id = p_session_id;

  if found then
    select * into player_row
    from public.arcade_profiles
    where clerk_user_id = session_row.clerk_user_id;
    return jsonb_build_object(
      'xpEarned', existing_score.xp_earned,
      'xp', player_row.xp,
      'level', player_row.level,
      'currentStreak', player_row.current_streak
    );
  end if;

  if session_row.mode = 'daily'
     and exists (
       select 1
       from public.arcade_daily_completions
       where clerk_user_id = session_row.clerk_user_id
         and challenge_date = session_row.daily_challenge_date
         and game_key = session_row.game_key
     ) then
    raise exception 'Daily challenge has already been completed';
  end if;

  earned_xp := 10
    + least(session_row.correct_answers * 5, 250)
    + case
        when session_row.total_questions > 0
          and session_row.correct_answers = session_row.total_questions then 15
        else 0
      end
    + case when session_row.mode = 'daily' then 15 else 0 end;

  insert into public.arcade_profiles (clerk_user_id)
  values (session_row.clerk_user_id)
  on conflict (clerk_user_id) do nothing;

  select current_streak, last_played_on
  into next_streak, last_played_date
  from public.arcade_profiles
  where clerk_user_id = session_row.clerk_user_id
  for update;

  if last_played_date = current_date then
    select current_streak into next_streak
    from public.arcade_profiles
    where clerk_user_id = session_row.clerk_user_id;
  elsif last_played_date = current_date - 1 then
    next_streak := next_streak + 1;
  else
    next_streak := 1;
  end if;

  if session_row.mode = 'daily' and session_row.daily_challenge_date is not null then
    insert into public.arcade_daily_completions (
      clerk_user_id, challenge_date, game_key, session_id
    ) values (
      session_row.clerk_user_id, session_row.daily_challenge_date, session_row.game_key, session_row.id
    );
  end if;

  insert into public.arcade_scores (
    session_id, clerk_user_id, game_key, mode, score,
    correct_answers, total_questions, xp_earned
  ) values (
    session_row.id, session_row.clerk_user_id, session_row.game_key, session_row.mode,
    session_row.score, session_row.correct_answers, session_row.total_questions, earned_xp
  );

  insert into public.arcade_game_stats (
    clerk_user_id, game_key, games_played, wins, high_score, score_total,
    correct_answers, questions_answered
  ) values (
    session_row.clerk_user_id, session_row.game_key, 1,
    case when session_row.correct_answers > 0 then 1 else 0 end,
    session_row.score, session_row.score,
    session_row.correct_answers, session_row.total_questions
  )
  on conflict (clerk_user_id, game_key) do update
  set games_played = arcade_game_stats.games_played + 1,
      wins = arcade_game_stats.wins
        + case when session_row.correct_answers > 0 then 1 else 0 end,
      high_score = greatest(arcade_game_stats.high_score, session_row.score),
      score_total = arcade_game_stats.score_total + session_row.score,
      correct_answers = arcade_game_stats.correct_answers + session_row.correct_answers,
      questions_answered = arcade_game_stats.questions_answered + session_row.total_questions,
      updated_at = now();

  update public.arcade_profiles
  set xp = xp + earned_xp,
      level = floor(sqrt((xp + earned_xp)::numeric / 100))::integer + 1,
      current_streak = next_streak,
      best_streak = greatest(best_streak, next_streak),
      last_played_on = current_date,
      games_played = games_played + 1,
      wins = wins + case when session_row.correct_answers > 0 then 1 else 0 end,
      correct_answers = correct_answers + session_row.correct_answers,
      questions_answered = questions_answered + session_row.total_questions,
      updated_at = now()
  where clerk_user_id = session_row.clerk_user_id
  returning * into player_row;

  if player_row.games_played >= 1 then
    insert into public.arcade_achievements (clerk_user_id, achievement_key)
    values (session_row.clerk_user_id, 'first-run')
    on conflict do nothing;
  end if;
  if player_row.games_played >= 10 then
    insert into public.arcade_achievements (clerk_user_id, achievement_key)
    values (session_row.clerk_user_id, 'ten-games')
    on conflict do nothing;
  end if;
  if session_row.total_questions > 0
     and session_row.correct_answers = session_row.total_questions then
    insert into public.arcade_achievements (clerk_user_id, achievement_key)
    values (session_row.clerk_user_id, 'perfect-run')
    on conflict do nothing;
  end if;
  if player_row.best_streak >= 3 then
    insert into public.arcade_achievements (clerk_user_id, achievement_key)
    values (session_row.clerk_user_id, 'three-day-streak')
    on conflict do nothing;
  end if;

  return jsonb_build_object(
    'xpEarned', earned_xp,
    'xp', player_row.xp,
    'level', player_row.level,
    'currentStreak', player_row.current_streak,
    'bestStreak', player_row.best_streak,
    'gamesPlayed', player_row.games_played
  );
end;
$$;

create or replace function public.arcade_weekly_leaderboard(p_since timestamptz)
returns table (
  username text,
  display_name text,
  xp bigint,
  level integer,
  games_played integer,
  current_streak integer
)
language sql
security definer
set search_path = public, pg_temp
as $$
  select
    p.username,
    p.display_name,
    sum(s.xp_earned)::bigint as xp,
    ap.level,
    ap.games_played,
    ap.current_streak
  from public.arcade_scores s
  join public.profiles p on p.clerk_user_id = s.clerk_user_id
  join public.arcade_profiles ap on ap.clerk_user_id = s.clerk_user_id
  where s.created_at >= p_since
  group by p.username, p.display_name, ap.level, ap.games_played, ap.current_streak
  order by xp desc, p.username asc
  limit 50
$$;

create or replace function public.rotate_arcade_questions(
  p_owner_key text,
  p_game_key text,
  p_candidate_ids text[],
  p_count integer
)
returns text[]
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  previous_seen jsonb;
  available_ids text[];
  selected_ids text[];
  wrapped_ids text[];
  selected_seen jsonb;
  required_wrap integer;
begin
  if p_owner_key is null or length(p_owner_key) > 160
     or p_game_key not in ('guess-movie', 'trivia', 'higher-lower', 'emoji', 'movie-wordle')
     or p_candidate_ids is null or p_count < 1
     or cardinality(p_candidate_ids) < p_count
     or cardinality(p_candidate_ids) <> (
       select count(distinct candidate_id)
       from unnest(p_candidate_ids) as candidate(candidate_id)
     ) then
    raise exception 'Invalid Arcade question rotation request';
  end if;

  insert into public.arcade_question_rotations (owner_key, game_key)
  values (p_owner_key, p_game_key)
  on conflict (owner_key, game_key) do nothing;

  select seen_ids into previous_seen
  from public.arcade_question_rotations
  where owner_key = p_owner_key and game_key = p_game_key
  for update;

  select coalesce(array_agg(candidate.question_id order by candidate.position), array[]::text[])
  into available_ids
  from unnest(p_candidate_ids) with ordinality as candidate(question_id, position)
  where not (previous_seen ? candidate.question_id);

  selected_ids := coalesce(available_ids[1:least(p_count, cardinality(available_ids))], array[]::text[]);
  if cardinality(selected_ids) < p_count then
    required_wrap := p_count - cardinality(selected_ids);
    select coalesce(array_agg(candidate.question_id order by candidate.position), array[]::text[])
    into wrapped_ids
    from (
      select candidate.question_id, candidate.position
      from unnest(p_candidate_ids) with ordinality as candidate(question_id, position)
      where not (candidate.question_id = any(selected_ids))
      order by candidate.position
      limit required_wrap
    ) as remaining;
    selected_ids := selected_ids || wrapped_ids;
    select coalesce(jsonb_object_agg(question_id, 'true'::jsonb), '{}'::jsonb)
    into selected_seen
    from unnest(wrapped_ids) as selected(question_id);
    previous_seen := selected_seen;
  else
    select coalesce(jsonb_object_agg(question_id, 'true'::jsonb), '{}'::jsonb)
    into selected_seen
    from unnest(selected_ids) as selected(question_id);
    previous_seen := previous_seen || selected_seen;
  end if;

  update public.arcade_question_rotations
  set seen_ids = previous_seen, updated_at = now()
  where owner_key = p_owner_key and game_key = p_game_key;

  return selected_ids;
end;
$$;

create or replace function public.release_arcade_questions(
  p_owner_key text,
  p_game_key text,
  p_question_ids text[]
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_owner_key is null or p_game_key not in ('guess-movie', 'trivia', 'higher-lower', 'emoji', 'movie-wordle')
     or p_question_ids is null then
    raise exception 'Invalid Arcade question release request';
  end if;

  update public.arcade_question_rotations
  set seen_ids = seen_ids - p_question_ids, updated_at = now()
  where owner_key = p_owner_key and game_key = p_game_key;
end;
$$;

revoke all on function public.record_arcade_completion(uuid) from public, anon, authenticated;
grant execute on function public.record_arcade_completion(uuid) to service_role;
revoke all on function public.arcade_weekly_leaderboard(timestamptz) from public, anon, authenticated;
grant execute on function public.arcade_weekly_leaderboard(timestamptz) to service_role;
revoke all on function public.rotate_arcade_questions(text, text, text[], integer) from public, anon, authenticated;
grant execute on function public.rotate_arcade_questions(text, text, text[], integer) to service_role;
revoke all on function public.release_arcade_questions(text, text, text[]) from public, anon, authenticated;
grant execute on function public.release_arcade_questions(text, text, text[]) to service_role;

grant all on public.arcade_profiles to service_role;
grant all on public.arcade_game_sessions to service_role;
grant all on public.arcade_scores to service_role;
grant all on public.arcade_game_stats to service_role;
grant all on public.arcade_achievements to service_role;
grant all on public.arcade_daily_challenges to service_role;
grant all on public.arcade_question_rotations to service_role;
grant all on public.arcade_daily_completions to service_role;
