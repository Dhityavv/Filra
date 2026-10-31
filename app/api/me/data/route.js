import { getCurrentIdentity } from '../../../../lib/auth';
import { getOrCreateProfile } from '../../../../lib/profiles';
import { getSupabaseAdmin } from '../../../../lib/supabase-admin';

export async function GET() {
  const identity = await getCurrentIdentity();
  if (identity.error) return identity.error;

  try {
    await getOrCreateProfile(identity.userId);
    const db = getSupabaseAdmin();
    const [ratings, watchlist] = await Promise.all([
      db.from('movie_ratings')
        .select('movie_id, movie, score, review, updated_at')
        .eq('clerk_user_id', identity.userId),
      db.from('watchlist')
        .select('movie_id, movie, added_at')
        .eq('clerk_user_id', identity.userId),
    ]);

    if (ratings.error) throw ratings.error;
    if (watchlist.error) throw watchlist.error;
    return Response.json({ ratings: ratings.data, watchlist: watchlist.data });
  } catch (error) {
    console.error('Failed to load account movie data:', error);
    return Response.json({ error: 'Rating dan watchlist akun gagal dimuat.' }, { status: 500 });
  }
}
