import { getClerkUser, getCurrentIdentity } from '../../../../lib/auth';
import { getOrCreateProfile } from '../../../../lib/profiles';
import { readJsonObject } from '../../../../lib/request-body';
import { getSupabaseAdmin } from '../../../../lib/supabase-admin';

export async function GET() {
  const identity = await getCurrentIdentity();
  if (identity.error) return identity.error;

  try {
    const stored = await getOrCreateProfile(identity.userId);
    const clerkUser = await getClerkUser();
    const profile = {
      username: stored.username,
      display_name: stored.display_name,
      bio: stored.bio,
      image_url: clerkUser?.imageUrl || '',
      created_at: stored.created_at,
    };
    return Response.json({ profile });
  } catch (error) {
    console.error('Failed to load editable profile:', error);
    return Response.json({ error: 'Profil gagal dimuat. Periksa konfigurasi database.' }, { status: 500 });
  }
}

export async function PATCH(request) {
  const identity = await getCurrentIdentity();
  if (identity.error) return identity.error;

  const parsed = await readJsonObject(request);
  if (parsed.error) return parsed.error;
  const { body } = parsed;
  const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
  const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : '';
  const bio = typeof body.bio === 'string' ? body.bio.trim() : '';

  if (!/^[a-z0-9_]{3,24}$/.test(username)) {
    return Response.json({ error: 'Username harus 3–24 karakter: huruf kecil, angka, atau garis bawah.' }, { status: 400 });
  }
  if (!displayName || displayName.length > 50) {
    return Response.json({ error: 'Nama wajib diisi dan maksimal 50 karakter.' }, { status: 400 });
  }
  if (bio.length > 300) {
    return Response.json({ error: 'Bio maksimal 300 karakter.' }, { status: 400 });
  }
  try {
    const db = getSupabaseAdmin();
    const updated = await db
      .from('profiles')
      .update({
        username,
        display_name: displayName,
        bio,
        updated_at: new Date().toISOString(),
      })
      .eq('clerk_user_id', identity.userId)
      .select('clerk_user_id, username, display_name, bio, created_at')
      .single();

    if (updated.error?.code === '23505') {
      return Response.json({ error: 'Username sudah digunakan. Pilih username lain.' }, { status: 409 });
    }
    if (updated.error) throw updated.error;
    return Response.json({ profile: updated.data });
  } catch (error) {
    console.error('Failed to save Filra profile:', error);
    return Response.json({ error: 'Profil gagal disimpan.' }, { status: 500 });
  }
}
