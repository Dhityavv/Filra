import { getCurrentIdentity } from '../../../../lib/auth';
import { readJsonObject } from '../../../../lib/request-body';
import { getSupabaseAdmin } from '../../../../lib/supabase-admin';

export async function PATCH(request, { params }) {
  const identity = await getCurrentIdentity();
  if (identity.error) return identity.error;

  const { requestId } = await params;
  const parsed = await readJsonObject(request);
  if (parsed.error) return parsed.error;
  const { action } = parsed.body;
  if (!/^[0-9a-f-]{36}$/i.test(requestId)) {
    return Response.json({ error: 'Permintaan tidak valid.' }, { status: 400 });
  }
  if (!['accept', 'decline', 'cancel'].includes(action)) {
    return Response.json({ error: 'Aksi tidak valid.' }, { status: 400 });
  }

  try {
    const db = getSupabaseAdmin();
    const ownerField = action === 'cancel' ? 'requester_id' : 'recipient_id';
    const query = db.from('friend_requests')
      .select('id')
      .eq('id', requestId)
      .eq(ownerField, identity.userId)
      .eq('status', 'pending')
      .maybeSingle();
    const existing = await query;
    if (existing.error) throw existing.error;
    if (!existing.data) {
      return Response.json({ error: 'Permintaan tidak ditemukan atau sudah berubah.' }, { status: 404 });
    }

    if (action === 'accept') {
      const updated = await db.from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId)
        .eq('recipient_id', identity.userId)
        .eq('status', 'pending');
      if (updated.error) throw updated.error;
    } else {
      const removed = await db.from('friend_requests')
        .delete()
        .eq('id', requestId)
        .eq('status', 'pending')
        .eq(ownerField, identity.userId);
      if (removed.error) throw removed.error;
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error('Failed to update friend request:', error);
    return Response.json({ error: 'Permintaan pertemanan gagal diperbarui.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const identity = await getCurrentIdentity();
  if (identity.error) return identity.error;

  const { requestId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(requestId)) {
    return Response.json({ error: 'Pertemanan tidak valid.' }, { status: 400 });
  }

  try {
    const db = getSupabaseAdmin();
    const existing = await db.from('friend_requests')
      .select('id')
      .eq('id', requestId)
      .eq('status', 'accepted')
      .or(`requester_id.eq.${identity.userId},recipient_id.eq.${identity.userId}`)
      .maybeSingle();
    if (existing.error) throw existing.error;
    if (!existing.data) return Response.json({ error: 'Pertemanan tidak ditemukan.' }, { status: 404 });

    const removed = await db.from('friend_requests')
      .delete()
      .eq('id', requestId)
      .eq('status', 'accepted')
      .or(`requester_id.eq.${identity.userId},recipient_id.eq.${identity.userId}`);
    if (removed.error) throw removed.error;
    return Response.json({ ok: true });
  } catch (error) {
    console.error('Failed to remove friend:', error);
    return Response.json({ error: 'Teman gagal dihapus.' }, { status: 500 });
  }
}
