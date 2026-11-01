'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ARCADE_GAMES } from '../../lib/arcade/definitions';

const BADGES = {
  'first-run': ['First Frame', 'Selesaikan game pertamamu.'],
  'ten-games': ['Regular at the Arcade', 'Selesaikan 10 game.'],
  'perfect-run': ['Perfect Take', 'Selesaikan satu run tanpa jawaban salah.'],
  'three-day-streak': ['Three-Day Reel', 'Bermain selama tiga hari berturut-turut.'],
};

function formatDate(value) {
  return new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ArcadeStatistics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/arcade/stats')
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Statistik gagal dimuat.');
        return payload;
      })
      .then(setData)
      .catch((requestError) => setError(requestError.message || 'Tidak dapat memuat statistik.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="arcade-state-message">Memuat statistik pemain...</div>;
  if (error) return <p className="arcade-error" role="alert">{error}</p>;
  if (data?.guest) {
    return (
      <div className="arcade-subpage">
        <div className="arcade-page-title"><span className="arcade-eyebrow">PLAYER DATA</span><h1>Your statistics</h1></div>
        <section className="arcade-guest-callout">
          <div><h2>Statistik permanen butuh akun.</h2><p>Kamu tetap bisa mencoba semua game sebagai tamu. Login agar riwayat, XP, streak, dan badge tersimpan.</p></div>
          <Link className="arcade-primary-button" href="/minigames">Browse games</Link>
        </section>
      </div>
    );
  }

  const profile = data.profile;
  const accuracy = profile.questions_answered
    ? Math.round((profile.correct_answers / profile.questions_answered) * 100)
    : 0;
  const gameStats = new Map(data.gameStats.map((game) => [game.game_key, game]));
  return (
    <div className="arcade-subpage">
      <div className="arcade-page-title">
        <span className="arcade-eyebrow">PLAYER DATA</span><h1>Your statistics</h1>
        <p>Perjalanan game dan progression Filra Minigames milik akunmu.</p>
      </div>
      <div className="arcade-stat-grid">
        <div><span>Total XP</span><strong>{Number(profile.xp).toLocaleString()}</strong></div>
        <div><span>Level</span><strong>{profile.level}</strong></div>
        <div><span>Games played</span><strong>{profile.games_played}</strong></div>
        <div><span>Current streak</span><strong>{profile.current_streak} days</strong></div>
        <div><span>Best streak</span><strong>{profile.best_streak} days</strong></div>
        <div><span>Accuracy</span><strong>{accuracy}%</strong></div>
      </div>

      <section className="arcade-table-panel arcade-stats-section">
        <div className="arcade-section-heading compact"><div><span className="arcade-eyebrow">BY GAME</span><h2>Game breakdown</h2></div></div>
        <div className="arcade-breakdown-list">
          {ARCADE_GAMES.map((game) => {
            const stats = gameStats.get(game.key);
            const played = stats?.games_played || 0;
            const best = stats?.high_score || 0;
            return (
              <div className="arcade-breakdown-row" key={game.key}>
                <span className={`arcade-mini-mark accent-${game.accent}`}>{game.icon}</span>
                <span className="arcade-breakdown-name">{game.title}</span>
                <span>{played} games</span>
                <strong>{best.toLocaleString()} best</strong>
              </div>
            );
          })}
        </div>
      </section>

      <section className="arcade-table-panel arcade-stats-section">
        <div className="arcade-section-heading compact"><div><span className="arcade-eyebrow">SESSION LOG</span><h2>Recent games</h2></div></div>
        {!data.scores.length ? (
          <div className="arcade-empty-state"><p>Belum ada riwayat game. <Link href="/minigames">Mulai bermain</Link>.</p></div>
        ) : (
          <div className="arcade-history-list">
            {data.scores.map((score, index) => {
              const game = ARCADE_GAMES.find((item) => item.key === score.game_key);
              return (
                <div className="arcade-history-row" key={`${score.created_at}-${index}`}>
                  <span>{formatDate(score.created_at)}</span>
                  <strong>{game?.title || score.game_key}</strong>
                  <span>{score.correct_answers}/{score.total_questions} correct</span>
                  <b>{Number(score.score).toLocaleString()} pts</b>
                  <small>+{score.xp_earned} XP</small>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="arcade-table-panel arcade-stats-section">
        <div className="arcade-section-heading compact"><div><span className="arcade-eyebrow">COLLECTED</span><h2>Achievements</h2></div></div>
        {!data.achievements.length ? (
          <div className="arcade-empty-state"><p>Belum ada badge. Selesaikan game pertamamu untuk membuka First Frame.</p></div>
        ) : (
          <div className="arcade-badge-grid">
            {data.achievements.map((achievement) => {
              const badge = BADGES[achievement.achievement_key];
              if (!badge) return null;
              return <div className="arcade-badge-card" key={achievement.achievement_key}>
                <span className="arcade-achievement-icon">+</span>
                <strong>{badge[0]}</strong><small>{badge[1]}</small>
              </div>;
            })}
          </div>
        )}
      </section>
    </div>
  );
}
