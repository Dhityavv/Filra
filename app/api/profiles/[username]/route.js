import { getSupabaseAdmin } from '../../../../lib/supabase-admin';
import { isFavoriteTableMissing } from '../../../../lib/favorites';

export async function GET(_request, { params }) {
  const { username } = await params;
  if (!/^[a-z0-9_]{3,24}$/.test(username)) {
    return Response.json({ error: 'Profil tidak ditemukan.' }, { status: 404 });
  }

  try {
    const db = getSupabaseAdmin();
    const profile = await db
      .from('profiles')
      .select('clerk_user_id, username, display_name, bio, created_at')
      .eq('username', username)
      .maybeSingle();

    if (profile.error) throw profile.error;
    if (!profile.data) return Response.json({ error: 'Profil tidak ditemukan.' }, { status: 404 });

    const [ratings, favorites, watchlist] = await Promise.all([
      db
        .from('movie_ratings')
        .select('movie_id, movie, score, review, updated_at')
        .eq('clerk_user_id', profile.data.clerk_user_id)
        .order('updated_at', { ascending: false }),
      db
        .from('favorite_movies')
        .select('movie_id, movie, favorited_at')
        .eq('clerk_user_id', profile.data.clerk_user_id)
        .order('favorited_at', { ascending: false }),
      db
        .from('watchlist')
        .select('movie_id, movie, added_at')
        .eq('clerk_user_id', profile.data.clerk_user_id)
        .order('added_at', { ascending: false }),
    ]);

    if (ratings.error) throw ratings.error;
    const favoritesAvailable = !favorites.error;
    if (favorites.error && !isFavoriteTableMissing(favorites.error)) throw favorites.error;
    if (watchlist.error) throw watchlist.error;
    return Response.json({
      profile: {
        username: profile.data.username,
        display_name: profile.data.display_name,
        bio: profile.data.bio,
        created_at: profile.data.created_at,
      },
      ratings: ratings.data,
      favorites: favorites.data || [],
      favoritesAvailable,
      watchlist: watchlist.data,
    });
  } catch (error) {
    console.error('Failed to load public profile:', error);
    return Response.json({ error: 'Profil gagal dimuat.' }, { status: 500 });
  }
}
