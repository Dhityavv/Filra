'use client';

import { useEffect, useState } from 'react';
import CommunityNav from './community-nav';
import DocumentLink from './document-link';
import ProfileDashboard from './profile-dashboard';

export default function PublicProfile({ username }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch(`/api/profiles/${encodeURIComponent(username)}`, { cache: 'no-store' })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || 'Profil gagal dimuat.');
        return body;
      })
      .then((body) => {
        if (active) setData(body);
      })
      .catch((cause) => {
        if (active) setError(cause.message);
      });
    return () => { active = false; };
  }, [username]);

  if (error) {
    return <><CommunityNav /><main className="community-page"><p className="community-error" role="alert">{error}</p><DocumentLink href="/">Kembali ke Filra</DocumentLink></main></>;
  }
  if (!data) return <><CommunityNav /><main className="community-page"><p className="community-muted">Memuat profil...</p></main></>;

  return (
    <>
      <CommunityNav />
      <ProfileDashboard data={data} />
    </>
  );
}
