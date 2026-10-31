'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import CommunityNav from './community-nav';

function posterUrl(movie) {
  if (!movie?.poster_path) return '';
  if (/^https?:\/\//i.test(movie.poster_path)) return movie.poster_path;
  return `https://image.tmdb.org/t/p/w342${movie.poster_path}`;
}

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
    return <><CommunityNav /><main className="community-page"><p className="community-error" role="alert">{error}</p><Link href="/">Kembali ke Filra</Link></main></>;
  }
  if (!data) return <><CommunityNav /><main className="community-page"><p className="community-muted">Memuat profil...</p></main></>;

  const { profile, ratings } = data;
  return (
    <>
    <CommunityNav />
    <main className="community-page">
      <header className="community-card">
        <p className="eyebrow">Profil publik</p>
        <h1 className="section-head__title">{profile.display_name}</h1>
        <p className="community-muted">@{profile.username}</p>
        {profile.bio ? <p>{profile.bio}</p> : null}
        {profile.website_url ? <a className="profile-link" href={profile.website_url} rel="noreferrer" target="_blank">{profile.website_url}</a> : null}
        <p className="community-muted">{ratings.length} rating publik</p>
        <Link className="btn btn--ghost btn--sm" href="/community">Cari teman</Link>
      </header>

      <section className="community-card">
        <h2>Rating film</h2>
        {ratings.length ? (
          <div className="community-list">
            {ratings.map((rating) => (
              <article className="community-row" key={rating.movie_id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  {posterUrl(rating.movie) ? <Image alt="" height={84} src={posterUrl(rating.movie)} width={56} /> : null}
                  <div>
                    <h3>{rating.movie?.title || 'Film'}</h3>
                    <p className="community-muted">Rating {rating.score}/10</p>
                    {rating.review ? <p>{rating.review}</p> : null}
                  </div>
                </div>
                <span className="community-muted">{new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(rating.updated_at))}</span>
              </article>
            ))}
          </div>
        ) : <p className="community-muted">Belum ada rating publik.</p>}
      </section>
    </main>
    </>
  );
}
