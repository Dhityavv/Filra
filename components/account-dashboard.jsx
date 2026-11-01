'use client';

import { useEffect, useState } from 'react';
import CommunityNav from './community-nav';
import ProfileDashboard from './profile-dashboard';

async function requestJson(url) {
  const response = await fetch(url, { cache: 'no-store' });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || 'Profil gagal dimuat.');
  return body;
}

export default function AccountDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([requestJson('/api/me/profile'), requestJson('/api/me/data')])
      .then(([profileResponse, movieData]) => {
        if (active) setData({ profile: profileResponse.profile, ...movieData });
      })
      .catch((cause) => {
        if (active) setError(cause.message);
      });
    return () => { active = false; };
  }, []);

  return (
    <>
      <CommunityNav />
      {error ? (
        <main className="community-page"><p className="community-error" role="alert">{error}</p></main>
      ) : data ? (
        <ProfileDashboard data={data} isOwnProfile />
      ) : (
        <main className="community-page"><p className="community-muted">Memuat dashboard profil...</p></main>
      )}
    </>
  );
}
