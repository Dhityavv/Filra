import { getCurrentIdentity } from '../../../lib/auth';
import { getOrCreateProfile } from '../../../lib/profiles';
import { getSupabaseAdmin } from '../../../lib/supabase-admin';

export async function GET(request) {
  const identity = await getCurrentIdentity();
  if (identity.error) return identity.error;

  const query = new URL(request.url).searchParams.get('query')?.trim() || '';
  if (query.length < 2 || query.length > 40 || !/^[\p{L}\p{N}_ -]+$/u.test(query)) {
    return Response.json({ users: [] });
  }

  try {
    const ownProfile = await getOrCreateProfile(identity.userId);
    const safeQuery = query.replace(/[,%()]/g, '');
    const result = await getSupabaseAdmin()
      .from('profiles')
      .select('username, display_name, bio')
      .neq('clerk_user_id', identity.userId)
      .or(`username.ilike.%${safeQuery}%,display_name.ilike.%${safeQuery}%`)
      .order('username')
      .limit(20);

    if (result.error) throw result.error;
    return Response.json({ users: result.data, currentUsername: ownProfile.username });
  } catch (error) {
    console.error('Failed to search Filra users:', error);
    return Response.json({ error: 'Pencarian pengguna gagal.' }, { status: 500 });
  }
}
