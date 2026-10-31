import { getCurrentIdentity } from '../../../lib/auth';
import { getOrCreateProfile } from '../../../lib/profiles';
import { readJsonObject } from '../../../lib/request-body';
import { getSupabaseAdmin } from '../../../lib/supabase-admin';

function publicProfile(profile) {
  if (!profile) return null;
  return {
    username: profile.username,
    display_name: profile.display_name,
    bio: profile.bio,
  };
}

export async function GET() {
  const identity = await getCurrentIdentity();
  if (identity.error) return identity.error;

  try {
    await getOrCreateProfile(identity.userId);
    const db = getSupabaseAdmin();
    const [incoming, outgoing, accepted] = await Promise.all([
      db.from('friend_requests')
        .select('id, requester_id, created_at')
        .eq('recipient_id', identity.userId)
        .eq('status', 'pending'),
      db.from('friend_requests')
        .select('id, recipient_id, created_at')
        .eq('requester_id', identity.userId)
        .eq('status', 'pending'),
      db.from('friend_requests')
        .select('id, requester_id, recipient_id, created_at')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${identity.userId},recipient_id.eq.${identity.userId}`),
    ]);

    for (const result of [incoming, outgoing, accepted]) {
      if (result.error) throw result.error;
    }

    const profileIds = new Set([
      ...incoming.data.map((item) => item.requester_id),
      ...outgoing.data.map((item) => item.recipient_id),
      ...accepted.data.map((item) => (
        item.requester_id === identity.userId ? item.recipient_id : item.requester_id
      )),
    ]);
    const profiles = profileIds.size
      ? await db.from('profiles')
        .select('clerk_user_id, username, display_name, bio')
        .in('clerk_user_id', [...profileIds])
      : { data: [], error: null };
    if (profiles.error) throw profiles.error;

    const byId = new Map(profiles.data.map((profile) => [profile.clerk_user_id, profile]));
    const mapItems = (items, idField) => items.map((item) => ({
      id: item.id,
      createdAt: item.created_at,
      user: publicProfile(byId.get(item[idField])),
    }));

    return Response.json({
      incoming: mapItems(incoming.data, 'requester_id'),
      outgoing: mapItems(outgoing.data, 'recipient_id'),
      friends: accepted.data.map((item) => ({
        id: item.id,
        createdAt: item.created_at,
        user: publicProfile(byId.get(
          item.requester_id === identity.userId ? item.recipient_id : item.requester_id,
        )),
      })),
    });
  } catch (error) {
    console.error('Failed to load friend connections:', error);
    return Response.json({ error: 'Daftar teman gagal dimuat.' }, { status: 500 });
  }
}

export async function POST(request) {
  const identity = await getCurrentIdentity();
  if (identity.error) return identity.error;

  const parsed = await readJsonObject(request);
  if (parsed.error) return parsed.error;
  const { body } = parsed;
  const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
  if (!/^[a-z0-9_]{3,24}$/.test(username)) {
    return Response.json({ error: 'Username tidak valid.' }, { status: 400 });
  }

  try {
    const ownProfile = await getOrCreateProfile(identity.userId);
    const db = getSupabaseAdmin();
    const target = await db
      .from('profiles')
      .select('clerk_user_id, username')
      .eq('username', username)
      .maybeSingle();
    if (target.error) throw target.error;
    if (!target.data) return Response.json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 });
    if (target.data.clerk_user_id === ownProfile.clerk_user_id) {
      return Response.json({ error: 'Kamu tidak bisa menambahkan akun sendiri.' }, { status: 400 });
    }

    const previous = await db.from('friend_requests')
      .select('id, requester_id, recipient_id, status')
      .or(
        `and(requester_id.eq.${identity.userId},recipient_id.eq.${target.data.clerk_user_id}),and(requester_id.eq.${target.data.clerk_user_id},recipient_id.eq.${identity.userId})`,
      )
      .limit(1)
      .maybeSingle();
    if (previous.error) throw previous.error;
    if (previous.data?.status === 'accepted') {
      return Response.json({ error: 'Kalian sudah berteman.' }, { status: 409 });
    }
    if (previous.data) {
      return Response.json({ error: 'Permintaan pertemanan sudah ada. Periksa daftar permintaan.' }, { status: 409 });
    }

    const created = await db.from('friend_requests').insert({
      requester_id: identity.userId,
      recipient_id: target.data.clerk_user_id,
    }).select('id').single();
    if (created.error?.code === '23505') {
      return Response.json({ error: 'Permintaan pertemanan sudah ada. Periksa daftar permintaan.' }, { status: 409 });
    }
    if (created.error) throw created.error;
    return Response.json({ ok: true, requestId: created.data.id }, { status: 201 });
  } catch (error) {
    console.error('Failed to send friend request:', error);
    return Response.json({ error: 'Permintaan pertemanan gagal dikirim.' }, { status: 500 });
  }
}
