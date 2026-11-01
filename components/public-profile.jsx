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
  const initials = (profile.display_name || profile.username).trim().slice(0, 1).toLocaleUpperCase('id-ID') || '?';
  return (
    <>
    <CommunityNav />
    <main className="community-page">
      <header className="community-card profile-hero">
        <div className="profile-hero__identity">
          <span aria-hidden="true" className="community-avatar community-avatar--profile">{initials}</span>
          <div>
            <p className="eyebrow">Profil publik</p>
            <h1 className="section-head__title">{profile.display_name}</h1>
            <p className="community-muted">@{profile.username}</p>
          </div>
        </div>
        {profile.bio ? <p className="profile-hero__bio">{profile.bio}</p> : <p className="community-muted profile-hero__bio">Belum ada bio.</p>}
        <div className="profile-hero__footer">
          <span className="profile-rating-count"><strong>{ratings.length}</strong> rating publik</span>
          {profile.website_url ? <a className="profile-link" href={profile.website_url} rel="noreferrer" target="_blank">{profile.website_url}</a> : null}
          <Link className="btn btn--ghost btn--sm" href="/community">Cari teman</Link>
        </div>
      </header>

      <section className="community-card">
        <div className="profile-section-heading">
          <div><p className="eyebrow">SELERA FILM</p><h2>Rating film</h2></div>
          <span className="community-muted">{ratings.length} film</span>
        </div>
        {ratings.length ? (
          <div className="community-list profile-rating-list">
            {ratings.map((rating) => (
              <article className="community-row profile-rating-card" key={rating.movie_id}>
                <div className="profile-rating-card__movie">
                  {posterUrl(rating.movie) ? <Image alt="" className="profile-rating-poster" height={112} src={posterUrl(rating.movie)} width={75} /> : <span aria-hidden="true" className="profile-rating-poster profile-rating-poster--empty">FILM</span>}
                  <div>
                    <h3>{rating.movie?.title || 'Film'}</h3>
                    <p className="community-muted">Diperbarui {new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(rating.updated_at))}</p>
                    {rating.review ? <p className="profile-rating-review">{rating.review}</p> : null}
                  </div>
                </div>
                <span className="profile-score"><strong>{rating.score}</strong><small>/10</small></span>
              </article>
            ))}
          </div>
        ) : <p className="community-muted">Belum ada rating publik.</p>}
      </section>
    </main>
    </>
  );
}
