import { getClerkUser } from './auth';
import { getSupabaseAdmin } from './supabase-admin';

function usernameBase(value) {
  const cleaned = value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 24);
  return cleaned.length >= 3 ? cleaned : 'user';
}

export async function getOrCreateProfile(userId) {
  const db = getSupabaseAdmin();
  const existing = await db
    .from('profiles')
    .select('clerk_user_id, username, display_name, bio, website_url, created_at')
    .eq('clerk_user_id', userId)
    .maybeSingle();

  if (existing.error) throw existing.error;
  if (existing.data) return existing.data;

  const clerkUser = await getClerkUser();
  if (!clerkUser || clerkUser.userId !== userId) {
    throw new Error('Informasi akun Clerk tidak tersedia.');
  }

  const base = usernameBase(clerkUser.username || clerkUser.email.split('@')[0] || userId.slice(-8));
  const suffix = userId.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toLowerCase();
  const profile = {
    clerk_user_id: userId,
    username: base,
    display_name: (clerkUser.name || base).slice(0, 50),
  };
  const inserted = await db.from('profiles').insert(profile).select().single();

  if (!inserted.error) return inserted.data;
  if (inserted.error.code !== '23505') throw inserted.error;

  const concurrentProfile = await db
    .from('profiles')
    .select('clerk_user_id, username, display_name, bio, website_url, created_at')
    .eq('clerk_user_id', userId)
    .maybeSingle();
  if (concurrentProfile.error) throw concurrentProfile.error;
  if (concurrentProfile.data) return concurrentProfile.data;

  const uniqueUsername = `${base.slice(0, 17)}_${suffix}`;
  const retry = await db
    .from('profiles')
    .insert({ ...profile, username: uniqueUsername })
    .select()
    .single();

  if (retry.error?.code === '23505') {
    const createdProfile = await db
      .from('profiles')
      .select('clerk_user_id, username, display_name, bio, website_url, created_at')
      .eq('clerk_user_id', userId)
      .maybeSingle();
    if (createdProfile.error) throw createdProfile.error;
    if (createdProfile.data) return createdProfile.data;
  }
  if (retry.error) throw retry.error;
  return retry.data;
}

export function isValidWebsite(value) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}
