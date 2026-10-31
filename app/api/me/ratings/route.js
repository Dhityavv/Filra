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
  const score = Number(body.score);
  const review = typeof body.review === 'string' ? body.review.trim() : '';
  if (!validMovieId(movieId) || !isValidMovieSnapshot(body.movie, movieId)
    || !Number.isInteger(score) || score < 1 || score > 10 || review.length > 500) {
    return Response.json({ error: 'Data rating tidak valid.' }, { status: 400 });
  }

  try {
    await getOrCreateProfile(identity.userId);
    const db = getSupabaseAdmin();
    const result = await db.from('movie_ratings').upsert({
      clerk_user_id: identity.userId,
      movie_id: movieId,
      movie: body.movie,
      score,
      review,
      updated_at: new Date().toISOString(),
    });
    if (result.error) throw result.error;
    return Response.json({ ok: true });
  } catch (error) {
    console.error('Failed to save movie rating:', error);
    return Response.json({ error: 'Rating gagal disimpan ke akun.' }, { status: 500 });
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
      .from('movie_ratings')
      .delete()
      .eq('clerk_user_id', identity.userId)
      .eq('movie_id', movieId);
    if (result.error) throw result.error;
    return Response.json({ ok: true });
  } catch (error) {
    console.error('Failed to delete movie rating:', error);
    return Response.json({ error: 'Rating gagal dihapus.' }, { status: 500 });
  }
}
