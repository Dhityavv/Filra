import Image from 'next/image';
import Link from 'next/link';
import { FAVORITES_MIGRATION_MESSAGE } from '../lib/favorites';

function posterUrl(movie) {
  if (!movie?.poster_path) return '';
  if (/^https?:\/\//i.test(movie.poster_path)) return movie.poster_path;
  return `https://image.tmdb.org/t/p/w342${movie.poster_path}`;
}

function MovieCollection({ items, kind, title, eyebrow, emptyText, available = true }) {
  return (
    <section className="community-card profile-collection">
      <div className="profile-section-heading">
        <div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>
        <span className="community-muted">{items.length} film</span>
      </div>
      {items.length ? (
        <div className="community-list profile-rating-list">
          {items.map((item) => {
            const movie = item.movie;
            const poster = posterUrl(movie);
            return (
              <article className="community-row profile-rating-card" key={item.movie_id}>
                <div className="profile-rating-card__movie">
                  {poster ? (
                    <Image alt="" className="profile-rating-poster" height={112} src={poster} width={75} />
                  ) : (
                    <span aria-hidden="true" className="profile-rating-poster profile-rating-poster--empty">FILM</span>
                  )}
                  <div>
                    <h3>{movie?.title || 'Film'}</h3>
                    {kind === 'rating' ? (
                      <>
                        <p className="community-muted">
                          Diperbarui {new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(item.updated_at))}
                        </p>
                        {item.review ? <p className="profile-rating-review">{item.review}</p> : null}
                      </>
                    ) : (
                      <p className="community-muted">{kind === 'favorite' ? 'Film favorit' : 'Di watchlist'}</p>
                    )}
                  </div>
                </div>
                {kind === 'rating' ? (
                  <span className="profile-score"><strong>{item.score}</strong><small>/10</small></span>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : (
        <p className={available ? 'community-muted' : 'community-error'} role={available ? undefined : 'status'}>
          {available ? emptyText : FAVORITES_MIGRATION_MESSAGE}
        </p>
      )}
    </section>
  );
}

export default function ProfileDashboard({ data, isOwnProfile = false }) {
  const { profile, ratings, favorites = [], favoritesAvailable = true, watchlist = [] } = data;
  const displayName = profile.display_name || profile.username;
  const initials = displayName.trim().slice(0, 1).toLocaleUpperCase('id-ID') || '?';

  return (
    <main className="community-page">
      <header className="community-card profile-hero">
        <div className="profile-hero__identity">
          <span aria-hidden="true" className="community-avatar community-avatar--profile">{initials}</span>
          <div>
            <p className="eyebrow">{isOwnProfile ? 'Dashboard profil' : 'Profil publik'}</p>
            <h1 className="section-head__title">{displayName}</h1>
            <p className="community-muted">@{profile.username}</p>
          </div>
        </div>
        {profile.bio ? <p className="profile-hero__bio">{profile.bio}</p> : <p className="community-muted profile-hero__bio">Belum ada bio.</p>}
        <div className="profile-hero__footer">
          <span className="profile-rating-count"><strong>{ratings.length}</strong> rating</span>
          <span className="profile-rating-count"><strong>{favorites.length}</strong> favorit</span>
          <span className="profile-rating-count"><strong>{watchlist.length}</strong> watchlist</span>
          {isOwnProfile ? (
            <Link className="btn btn--ghost btn--sm" href="/account/manage">Manage account</Link>
          ) : (
            <Link className="btn btn--ghost btn--sm" href="/community">Cari teman</Link>
          )}
        </div>
      </header>

      <MovieCollection
        emptyText={favoritesAvailable ? 'Belum ada film yang ditambahkan ke favorit.' : 'Koleksi favorit belum tersedia.'}
        eyebrow="KOLEKSI PILIHAN"
        items={favorites}
        kind="favorite"
        title="Film favorit"
        available={favoritesAvailable}
      />
      <MovieCollection
        emptyText="Belum ada rating publik."
        eyebrow="SELERA FILM"
        items={ratings}
        kind="rating"
        title="Rating film"
      />
      <MovieCollection
        emptyText="Watchlist masih kosong."
        eyebrow="NANTI DITONTON"
        items={watchlist}
        kind="watchlist"
        title="Watchlist"
      />
    </main>
  );
}
