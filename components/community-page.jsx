'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import CommunityNav from './community-nav';

async function requestJson(url, options) {
  const response = await fetch(url, { cache: 'no-store', ...options });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || 'Permintaan gagal.');
  return body;
}

function PersonRow({ user, actions, featured = false }) {
  if (!user) return null;
  const displayName = user.display_name || user.username;
  const initials = displayName.trim().slice(0, 1).toLocaleUpperCase('id-ID') || '?';
  return (
    <div className={`community-row${featured ? ' community-friend-card' : ''}`}>
      <Link className="community-person-link" href={`/u/${user.username}`}>
        <span aria-hidden="true" className="community-avatar">{initials}</span>
        <span className="community-person-copy">
          <span className="community-row__name">{displayName}</span>
          <span className="community-muted">@{user.username}</span>
          {user.bio ? <span className="community-muted">{user.bio}</span> : null}
        </span>
      </Link>
      <div className="community-row__actions">{actions}</div>
    </div>
  );
}

export default function CommunityPage() {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [friends, setFriends] = useState({ incoming: [], outgoing: [], friends: [] });
  const [currentUsername, setCurrentUsername] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function refreshFriends() {
    const data = await requestJson('/api/friends');
    setFriends(data);
  }

  useEffect(() => {
    let active = true;
    Promise.all([requestJson('/api/me'), requestJson('/api/friends')])
      .then(([me, connections]) => {
        if (!active) return;
        setCurrentUsername(me.profile.username);
        setFriends(connections);
      })
      .catch((cause) => {
        if (active) setError(cause.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  async function search(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    if (query.trim().length < 2) {
      setError('Masukkan minimal 2 karakter untuk mencari.');
      return;
    }

    try {
      const data = await requestJson(`/api/users?query=${encodeURIComponent(query.trim())}`);
      setUsers(data.users);
      setCurrentUsername(data.currentUsername);
    } catch (cause) {
      setError(cause.message);
    }
  }

  async function updateRequest(requestId, action) {
    setError('');
    setMessage('');
    try {
      await requestJson(`/api/friends/${requestId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      await refreshFriends();
    } catch (cause) {
      setError(cause.message);
    }
  }

  async function removeFriend(requestId) {
    setError('');
    setMessage('');
    try {
      await requestJson(`/api/friends/${requestId}`, { method: 'DELETE' });
      await refreshFriends();
    } catch (cause) {
      setError(cause.message);
    }
  }

  async function sendRequest(username) {
    setError('');
    setMessage('');
    try {
      await requestJson('/api/friends', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      setMessage(`Permintaan pertemanan ke @${username} sudah dikirim.`);
      await refreshFriends();
    } catch (cause) {
      setError(cause.message);
    }
  }

  const friendIds = new Set(friends.friends.map((item) => item.user?.username));
  const outgoingIds = new Set(friends.outgoing.map((item) => item.user?.username));
  const incomingIds = new Set(friends.incoming.map((item) => item.user?.username));

  return (
    <>
    <CommunityNav />
    <main className="community-page">
      <header className="section-head">
        <div>
          <p className="eyebrow">Komunitas Filra</p>
          <h1 className="section-head__title">Cari teman</h1>
          <p className="community-muted">Temukan pengguna lewat username atau nama profil.</p>
        </div>
        {currentUsername ? <Link className="btn btn--ghost btn--sm" href={`/u/${currentUsername}`}>Lihat profil saya</Link> : null}
      </header>

      <section className="community-card" aria-labelledby="search-title">
        <h2 id="search-title">Cari pengguna</h2>
        <form className="community-form" onSubmit={search}>
          <input
            aria-label="Username atau nama"
            autoComplete="off"
            maxLength={40}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Contoh: namapengguna"
            value={query}
          />
          <button className="btn btn--primary" type="submit">Cari</button>
        </form>
        <div className="community-list">
          {users.map((user) => {
            const isFriend = friendIds.has(user.username);
            const isOutgoing = outgoingIds.has(user.username);
            const isIncoming = incomingIds.has(user.username);
            const actions = isFriend
              ? <span className="community-muted">Sudah berteman</span>
              : isOutgoing
                ? <span className="community-muted">Menunggu persetujuan</span>
                : isIncoming
                  ? <span className="community-muted">Cek permintaan masuk</span>
                  : <button className="btn btn--primary btn--sm" onClick={() => sendRequest(user.username)} type="button">Tambah teman</button>;
            return <PersonRow actions={actions} key={user.username} user={user} />;
          })}
        </div>
        {users.length === 0 && query.trim().length >= 2 ? <p className="community-muted">Tidak ada pengguna yang cocok.</p> : null}
      </section>

      <section className="community-card" aria-labelledby="requests-title">
        <h2 id="requests-title">Permintaan masuk ({friends.incoming.length})</h2>
        <div className="community-list">
          {friends.incoming.map((item) => (
            <PersonRow
              actions={
                <>
                  <button className="btn btn--primary btn--sm" onClick={() => updateRequest(item.id, 'accept')} type="button">Terima</button>
                  <button className="btn btn--ghost btn--sm" onClick={() => updateRequest(item.id, 'decline')} type="button">Tolak</button>
                </>
              }
              key={item.id}
              user={item.user}
            />
          ))}
          {!loading && friends.incoming.length === 0 ? <p className="community-muted">Belum ada permintaan masuk.</p> : null}
        </div>
      </section>

      <section className="community-card" aria-labelledby="sent-title">
        <h2 id="sent-title">Permintaan terkirim ({friends.outgoing.length})</h2>
        <div className="community-list">
          {friends.outgoing.map((item) => (
            <PersonRow
              actions={<button className="btn btn--ghost btn--sm" onClick={() => updateRequest(item.id, 'cancel')} type="button">Batalkan</button>}
              key={item.id}
              user={item.user}
            />
          ))}
          {!loading && friends.outgoing.length === 0 ? <p className="community-muted">Belum ada permintaan terkirim.</p> : null}
        </div>
      </section>

      <section className="community-card" aria-labelledby="friends-title">
        <h2 id="friends-title">Teman ({friends.friends.length})</h2>
        <div className="community-list">
          {friends.friends.map((item) => (
            <PersonRow
              actions={<button className="btn btn--ghost btn--sm" onClick={() => removeFriend(item.id)} type="button">Hapus teman</button>}
              featured
              key={item.id}
              user={item.user}
            />
          ))}
          {!loading && friends.friends.length === 0 ? <p className="community-muted">Kamu belum punya teman di Filra.</p> : null}
        </div>
      </section>

      {loading ? <p className="community-muted">Memuat komunitas...</p> : null}
      {message ? <p className="community-muted" role="status">{message}</p> : null}
      {error ? <p className="community-error" role="alert">{error}</p> : null}
    </main>
    </>
  );
}
