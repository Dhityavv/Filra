import Link from 'next/link';
import { ARCADE_GAMES } from '../../lib/arcade/definitions';

const ACHIEVEMENTS = {
  'first-run': { title: 'First Frame', detail: 'Mainkan game pertamamu.' },
  'ten-games': { title: 'Regular at the Arcade', detail: 'Selesaikan 10 game.' },
  'perfect-run': { title: 'Perfect Take', detail: 'Jawab semua pertanyaan dengan benar.' },
  'three-day-streak': { title: 'Three-Day Reel', detail: 'Bangun streak tiga hari.' },
};

function XPProgress({ profile }) {
  const xp = Number(profile.xp);
  const level = Number(profile.level);
  const floor = (level - 1) ** 2 * 100;
  const ceiling = level ** 2 * 100;
  const progress = Math.max(0, Math.min(100, ((xp - floor) / (ceiling - floor)) * 100));
  return (
    <section className="arcade-player-card">
      <div className="arcade-player-heading">
        <div>
          <span className="arcade-eyebrow">PLAYER PROGRESSION</span>
          <h2>Level {level}</h2>
        </div>
        <span className="arcade-level-badge">LVL {level}</span>
      </div>
      <div className="arcade-xp-track" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin="0" aria-valuemax="100">
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="arcade-xp-meta">
        <span>{xp.toLocaleString()} XP total</span>
        <span>{Math.max(0, ceiling - xp).toLocaleString()} XP to level {level + 1}</span>
      </div>
      <div className="arcade-player-stats">
        <div><strong>{Number(profile.games_played).toLocaleString()}</strong><span>Games</span></div>
        <div><strong>{Number(profile.wins).toLocaleString()}</strong><span>Wins</span></div>
        <div><strong>{Number(profile.current_streak).toLocaleString()} days</strong><span>Daily streak</span></div>
      </div>
    </section>
  );
}

function GameCard({ game, index }) {
  return (
    <Link href={game.href} className={`arcade-game-card accent-${game.accent}`}>
      <div className="arcade-game-card-top">
        <span className="arcade-game-number">{game.icon}</span>
        <span className="arcade-game-category">{game.category}</span>
      </div>
      <div className="arcade-game-art" aria-hidden="true">
        <span className="arcade-game-orbit arcade-game-orbit-one" />
        <span className="arcade-game-orbit arcade-game-orbit-two" />
        <span className="arcade-game-art-index">0{index + 1}</span>
      </div>
      <h3>{game.title}</h3>
      <p>{game.description}</p>
      <span className="arcade-game-play">ENTER GAME <span aria-hidden="true">→</span></span>
    </Link>
  );
}

export default function ArcadeDashboard({ overview, error }) {
  return (
    <div className="arcade-dashboard">
      <section className="arcade-hero">
        <div className="arcade-hero-copy">
          <span className="arcade-eyebrow">THE FILM LOVER&apos;S PLAYGROUND</span>
          <h1>Play the<br /><em>frame.</em></h1>
          <p>A cinematic playground for movie lovers. Put your film knowledge to the test, chase a new high score, and earn your place in the spotlight.</p>
          <a className="arcade-primary-button" href="#games">Explore games <span aria-hidden="true">↓</span></a>
        </div>
        <div className="arcade-hero-visual" aria-hidden="true">
          <div className="arcade-hero-sun" />
          <div className="arcade-hero-ring arcade-hero-ring-one" />
          <div className="arcade-hero-ring arcade-hero-ring-two" />
          <div className="arcade-hero-scanline" />
          <span className="arcade-hero-stamp">FILRA<br />ARCADE</span>
          <span className="arcade-hero-vertical">EST. FOR MOVIE LOVERS</span>
        </div>
      </section>

      {error ? (
        <section className="arcade-alert" role="status">
          <strong>Progression belum siap.</strong>
          <span>{error} Pastikan konfigurasi Supabase aktif dan migrasi <code>supabase/arcade.sql</code> sudah dijalankan.</span>
        </section>
      ) : null}

      {!error && overview?.profile ? (
        <XPProgress profile={overview.profile} />
      ) : (
        <section className="arcade-guest-callout">
          <div>
            <span className="arcade-eyebrow">YOUR NEXT HIGH SCORE STARTS HERE</span>
            <h2>Main gratis. Simpan progres saat masuk.</h2>
            <p>Semua game bisa dicoba tanpa akun. Login untuk menyimpan XP, streak, achievement, dan masuk leaderboard.</p>
          </div>
          <span className="arcade-guest-symbol" aria-hidden="true">XP</span>
        </section>
      )}

      <section className="arcade-section" id="games">
        <div className="arcade-section-heading">
          <div><span className="arcade-eyebrow">CHOOSE YOUR CHALLENGE</span><h2>The arcade</h2></div>
          <span className="arcade-section-count">05 GAMES</span>
        </div>
        <div className="arcade-game-grid">
          {ARCADE_GAMES.map((game, index) => <GameCard game={game} index={index} key={game.key} />)}
        </div>
      </section>

      <section className="arcade-lower-grid">
        <div className="arcade-panel">
          <div className="arcade-section-heading compact">
            <div><span className="arcade-eyebrow">ON THE DAILY</span><h2>Daily challenges</h2></div>
            <span className="arcade-live-dot">RESETS AT 00:00 UTC</span>
          </div>
          <div className="arcade-daily-list">
            {['guess-movie', 'trivia', 'emoji', 'movie-wordle'].map((key) => {
              const game = ARCADE_GAMES.find((item) => item.key === key);
              const isComplete = overview?.dailyCompletions?.includes(key);
              const practiceMode = { 'guess-movie': 'normal', trivia: 'ten', emoji: 'five', 'movie-wordle': 'practice' }[key];
              return <Link href={`${game.href}?mode=${isComplete ? practiceMode : 'daily'}`} className="arcade-daily-row" key={key}>
                <span className={`arcade-mini-mark accent-${game.accent}`}>{game.icon}</span>
                <span><strong>{game.title}</strong><small>{isComplete ? 'Completed today · practice more' : 'New challenge, every day'}</small></span>
                <b aria-hidden="true">{isComplete ? 'DONE' : '→'}</b>
              </Link>;
            })}
          </div>
        </div>
        <div className="arcade-panel arcade-achievement-panel">
          <div className="arcade-section-heading compact">
            <div><span className="arcade-eyebrow">MILESTONES</span><h2>Your achievements</h2></div>
            <Link href="/arcade/statistics">All stats →</Link>
          </div>
          {!overview?.achievements?.length ? (
            <div className="arcade-empty-state">
              <span className="arcade-empty-icon">01</span>
              <p>Achievement pertamamu menunggu. Mulai satu game untuk membuka badge.</p>
            </div>
          ) : (
            <div className="arcade-achievement-list">
              {overview.achievements.slice(0, 4).map((earned) => {
                const badge = ACHIEVEMENTS[earned.achievement_key];
                if (!badge) return null;
                return <div className="arcade-achievement-row" key={earned.achievement_key}>
                  <span className="arcade-achievement-icon">+</span>
                  <span><strong>{badge.title}</strong><small>{badge.detail}</small></span>
                </div>;
              })}
            </div>
          )}
        </div>
      </section>

      <section className="arcade-feature-banner">
        <div><span className="arcade-eyebrow">YOUR NAME IN LIGHTS</span><h2>Every legend starts<br />with one more round.</h2></div>
        <Link href="/arcade/leaderboard" className="arcade-outline-button">View leaderboard <span aria-hidden="true">→</span></Link>
      </section>
    </div>
  );
}
