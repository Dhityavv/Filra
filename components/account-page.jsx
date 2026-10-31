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
          websiteUrl: data.website_url,
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
        websiteUrl: saved.website_url,
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
          <h1 className="section-head__title">Atur profil</h1>
        </div>
      </header>
      <section className="community-card">
        {loading ? <p className="community-muted">Memuat profil...</p> : null}
        {profile ? (
          <form className="profile-form" onSubmit={save}>
            <label>
              Username unik
              <input maxLength={24} minLength={3} onChange={(event) => update('username', event.target.value)} required value={profile.username} />
              <span className="community-muted">Profil publik kamu: <Link href={`/u/${profile.username}`}>/u/{profile.username}</Link></span>
            </label>
            <label>
              Nama tampilan
              <input maxLength={50} onChange={(event) => update('displayName', event.target.value)} required value={profile.displayName} />
            </label>
            <label>
              Bio
              <textarea maxLength={300} onChange={(event) => update('bio', event.target.value)} rows={4} value={profile.bio} />
            </label>
            <label>
              Link profil
              <input maxLength={200} onChange={(event) => update('websiteUrl', event.target.value)} placeholder="https://contoh.com" type="url" value={profile.websiteUrl} />
            </label>
            <button className="btn btn--primary" disabled={loading} type="submit">Simpan profil</button>
          </form>
        ) : null}
        {message ? <p className="community-muted" role="status">{message}</p> : null}
        {error ? <p className="community-error" role="alert">{error}</p> : null}
      </section>
    </main>
    </>
  );
}
