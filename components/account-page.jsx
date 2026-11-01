'use client';

import { useEffect, useState } from 'react';
import AccountSecurity from './account-security';
import CommunityNav from './community-nav';

async function requestJson(url, options) {
  const response = await fetch(url, { cache: 'no-store', ...options });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || 'Permintaan gagal.');
  return body;
}

export default function AccountPage() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    requestJson('/api/me/profile')
      .then(({ profile: data }) => {
        if (active) setProfile({
          username: data.username,
          displayName: data.display_name,
          bio: data.bio,
        });
      })
      .catch((cause) => {
        if (active) setError(cause.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  function update(field, value) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  async function save(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      const { profile: saved } = await requestJson('/api/me/profile', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(profile),
      });
      setProfile({
        username: saved.username,
        displayName: saved.display_name,
        bio: saved.bio,
      });
      setMessage('Profil berhasil disimpan.');
    } catch (cause) {
      setError(cause.message);
    }
  }

  return (
    <>
    <CommunityNav />
    <main className="community-page">
      <header className="section-head">
        <div>
          <p className="eyebrow">Akun Filra</p>
          <h1 className="section-head__title">Manage account</h1>
        </div>
      </header>
      <section className="community-card">
        {loading ? <p className="community-muted">Memuat profil...</p> : null}
        {profile ? (
          <form className="profile-form" onSubmit={save}>
            <label>
              Username unik
              <input maxLength={24} minLength={3} onChange={(event) => update('username', event.target.value)} required value={profile.username} />
            </label>
            <label>
              Nama tampilan
              <input maxLength={50} onChange={(event) => update('displayName', event.target.value)} required value={profile.displayName} />
            </label>
            <label>
              Bio
              <textarea maxLength={300} onChange={(event) => update('bio', event.target.value)} rows={4} value={profile.bio} />
            </label>
            <button className="btn btn--primary" disabled={loading} type="submit">Simpan profil</button>
          </form>
        ) : null}
        {message ? <p className="community-muted" role="status">{message}</p> : null}
        {error ? <p className="community-error" role="alert">{error}</p> : null}
      </section>
      {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? <AccountSecurity /> : null}
    </main>
    </>
  );
}
