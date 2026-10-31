import { getCurrentIdentity } from '../../../lib/auth';
import { getOrCreateProfile } from '../../../lib/profiles';

export async function GET() {
  const identity = await getCurrentIdentity();
  if (identity.error) return identity.error;

  try {
    const stored = await getOrCreateProfile(identity.userId);
    const profile = {
      username: stored.username,
      display_name: stored.display_name,
      bio: stored.bio,
      website_url: stored.website_url,
      created_at: stored.created_at,
    };
    return Response.json({ profile });
  } catch (error) {
    console.error('Failed to load Filra profile:', error);
    return Response.json({ error: 'Profil gagal dimuat. Periksa konfigurasi database.' }, { status: 500 });
  }
}
