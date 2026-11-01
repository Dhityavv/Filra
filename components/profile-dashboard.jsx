import Image from 'next/image';
import { FAVORITES_MIGRATION_MESSAGE } from '../lib/favorites';
import DocumentLink from './document-link';

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
                <a
                  aria-label={`Buka detail film ${movie?.title || 'Film'}`}
                  className="profile-rating-card__link"
                  href={`/?movie=${encodeURIComponent(item.movie_id)}`}
                >
                  {poster ? (
                    <Image alt="" className="profile-rating-poster" height={112} src={poster} width={75} />
                  ) : (
                    <span aria-hidden="true" className="profile-rating-poster profile-rating-poster--empty">FILM</span>
                  )}
                  <span className="profile-rating-card__copy">
                    <strong>{movie?.title || 'Film'}</strong>
                    {kind === 'rating' ? (
                      <>
                        <span className="community-muted">
                          Diperbarui {new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(item.updated_at))}
                        </span>
                        {item.review ? <span className="profile-rating-review">{item.review}</span> : null}
                      </>
                    ) : (
                      <span className="community-muted">{kind === 'favorite' ? 'Film favorit' : 'Di watchlist'}</span>
                    )}
                  </span>
                </a>
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
  const { profile, ratings, favorites = [], favoritesAvailable = true, watchlist = [], arcade = { level: 1, xp: 0 } } = data;
  const displayName = profile.display_name || profile.username;
  const initials = displayName.trim().slice(0, 1).toLocaleUpperCase('id-ID') || '?';

  return (
    <main className="community-page profile-dashboard">
      <aside className="profile-sidebar">
        <section className="community-card profile-identity-card">
          <div
            aria-label={`${displayName} profile picture`}
            className="profile-identity-card__avatar"
            role="img"
            style={profile.image_url ? { backgroundImage: `url("${profile.image_url}")` } : undefined}
          >
            {!profile.image_url ? initials : null}
          </div>
          <p className="eyebrow">{isOwnProfile ? 'Dashboard profil' : 'Profil Filra'}</p>
          <h1 className="section-head__title">{displayName}</h1>
          <p className="community-muted profile-identity-card__username">@{profile.username}</p>
          <p className="profile-identity-card__bio">{profile.bio || 'Belum ada bio.'}</p>
          <div className="profile-level">
            <span className="profile-level__icon" aria-hidden="true">✦</span>
            <span>
              <small>MINIGAMES LEVEL</small>
              <strong>Level {arcade.level}</strong>
            </span>
            <span className="profile-level__xp">{Number(arcade.xp).toLocaleString('id-ID')} XP</span>
          </div>
          <div className="profile-identity-card__actions">
            {isOwnProfile ? (
              <DocumentLink className="btn btn--ghost btn--sm" href="/account/manage">Manage account</DocumentLink>
            ) : (
              <DocumentLink className="btn btn--ghost btn--sm" href="/community">Cari teman</DocumentLink>
            )}
          </div>
        </section>
      </aside>

      <div className="profile-content">
        <header className="profile-content__heading">
          <p className="eyebrow">RUANG FILM PRIBADI</p>
          <h2>Koleksi film</h2>
          <p className="community-muted">Rating, film favorit, dan watchlist {isOwnProfile ? 'kamu' : displayName}.</p>
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
      </div>
    </main>
  );
}
