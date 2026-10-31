import { getCurrentIdentity } from '../../../../lib/auth';
import { isValidMovieSnapshot } from '../../../../lib/movie-data';
import { getOrCreateProfile } from '../../../../lib/profiles';
import { readJsonObject } from '../../../../lib/request-body';
import { getSupabaseAdmin } from '../../../../lib/supabase-admin';

function validMovieId(value) {
  return Number.isSafeInteger(Number(value)) && Number(value) > 0;
}

export async function PUT(request) {
  const identity = await getCurrentIdentity();
  if (identity.error) return identity.error;

  const parsed = await readJsonObject(request);
  if (parsed.error) return parsed.error;
  const { body } = parsed;
  const movieId = Number(body.movieId);
  if (!validMovieId(movieId) || !isValidMovieSnapshot(body.movie, movieId)) {
    return Response.json({ error: 'Data film tidak valid.' }, { status: 400 });
  }

  try {
    await getOrCreateProfile(identity.userId);
    const result = await getSupabaseAdmin().from('watchlist').upsert({
      clerk_user_id: identity.userId,
      movie_id: movieId,
      movie: body.movie,
      added_at: new Date().toISOString(),
    });
    if (result.error) throw result.error;
    return Response.json({ ok: true });
  } catch (error) {
    console.error('Failed to save watchlist entry:', error);
    return Response.json({ error: 'Film gagal disimpan ke watchlist akun.' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const identity = await getCurrentIdentity();
  if (identity.error) return identity.error;

  const movieId = Number(new URL(request.url).searchParams.get('movieId'));
  if (!validMovieId(movieId)) {
    return Response.json({ error: 'ID film tidak valid.' }, { status: 400 });
  }

  try {
    await getOrCreateProfile(identity.userId);
    const result = await getSupabaseAdmin()
      .from('watchlist')
      .delete()
      .eq('clerk_user_id', identity.userId)
      .eq('movie_id', movieId);
    if (result.error) throw result.error;
    return Response.json({ ok: true });
  } catch (error) {
    console.error('Failed to remove watchlist entry:', error);
    return Response.json({ error: 'Film gagal dihapus dari watchlist akun.' }, { status: 500 });
  }
}
