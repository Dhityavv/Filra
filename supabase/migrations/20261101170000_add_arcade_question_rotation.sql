create table if not exists public.arcade_question_rotations (
  owner_key text not null,
  game_key text not null check (game_key in ('guess-movie', 'trivia', 'higher-lower', 'emoji', 'movie-wordle')),
  seen_ids jsonb not null default '{}'::jsonb check (jsonb_typeof(seen_ids) = 'object'),
  updated_at timestamptz not null default now(),
  primary key (owner_key, game_key)
);

alter table public.arcade_question_rotations enable row level security;
grant all on public.arcade_question_rotations to service_role;

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

revoke all on function public.rotate_arcade_questions(text, text, text[], integer) from public, anon, authenticated;
grant execute on function public.rotate_arcade_questions(text, text, text[], integer) to service_role;
revoke all on function public.release_arcade_questions(text, text, text[]) from public, anon, authenticated;
grant execute on function public.release_arcade_questions(text, text, text[]) to service_role;
