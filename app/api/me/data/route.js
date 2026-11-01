import { getCurrentIdentity } from '../../../../lib/auth';
import { isFavoriteTableMissing } from '../../../../lib/favorites';
import { getOrCreateProfile } from '../../../../lib/profiles';
import { getSupabaseAdmin } from '../../../../lib/supabase-admin';

export async function GET() {
  const identity = await getCurrentIdentity();
  if (identity.error) return identity.error;

  try {
    await getOrCreateProfile(identity.userId);
    const db = getSupabaseAdmin();
    const arcadeProfileInsert = await db
      .from('arcade_profiles')
      .upsert({ clerk_user_id: identity.userId }, { onConflict: 'clerk_user_id', ignoreDuplicates: true });
    if (arcadeProfileInsert.error) throw arcadeProfileInsert.error;
    const arcadeProfile = await db
      .from('arcade_profiles')
      .select('xp, level')
      .eq('clerk_user_id', identity.userId)
      .single();
    if (arcadeProfile.error) throw arcadeProfile.error;

    const [ratings, favorites, watchlist] = await Promise.all([
      db.from('movie_ratings')
        .select('movie_id, movie, score, review, updated_at')
        .eq('clerk_user_id', identity.userId)
        .order('updated_at', { ascending: false })
        .limit(100),
      db.from('favorite_movies')
        .select('movie_id, movie, favorited_at')
        .eq('clerk_user_id', identity.userId)
        .order('favorited_at', { ascending: false })
        .limit(100),
      db.from('watchlist')
        .select('movie_id, movie, added_at')
        .eq('clerk_user_id', identity.userId)
        .order('added_at', { ascending: false })
        .limit(100),
    ]);

    if (ratings.error) throw ratings.error;
    const favoritesAvailable = !favorites.error;
    if (favorites.error && !isFavoriteTableMissing(favorites.error)) throw favorites.error;
    if (watchlist.error) throw watchlist.error;
    return Response.json({
      ratings: ratings.data,
      favorites: favorites.data || [],
      favoritesAvailable,
      watchlist: watchlist.data,
      arcade: arcadeProfile.data || { xp: 0, level: 1 },
    });
  } catch (error) {
    console.error('Failed to load account movie data:', error);
    return Response.json({ error: 'Koleksi film akun gagal dimuat.' }, { status: 500 });
  }
}
