import { getSupabaseAdmin } from '../../../../lib/supabase-admin';

export async function GET(_request, { params }) {
  const { username } = await params;
  if (!/^[a-z0-9_]{3,24}$/.test(username)) {
    return Response.json({ error: 'Profil tidak ditemukan.' }, { status: 404 });
  }

  try {
    const db = getSupabaseAdmin();
    const profile = await db
      .from('profiles')
      .select('clerk_user_id, username, display_name, bio, website_url, created_at')
      .eq('username', username)
      .maybeSingle();

    if (profile.error) throw profile.error;
    if (!profile.data) return Response.json({ error: 'Profil tidak ditemukan.' }, { status: 404 });

    const ratings = await db
      .from('movie_ratings')
      .select('movie_id, movie, score, review, updated_at')
      .eq('clerk_user_id', profile.data.clerk_user_id)
      .order('updated_at', { ascending: false })
      .limit(100);

    if (ratings.error) throw ratings.error;
    return Response.json({
      profile: {
        username: profile.data.username,
        display_name: profile.data.display_name,
        bio: profile.data.bio,
        website_url: profile.data.website_url,
        created_at: profile.data.created_at,
      },
      ratings: ratings.data,
    });
  } catch (error) {
    console.error('Failed to load public profile:', error);
    return Response.json({ error: 'Profil gagal dimuat.' }, { status: 500 });
  }
}
