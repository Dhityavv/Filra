'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function ArcadeLeaderboard() {
  const [period, setPeriod] = useState('weekly');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch(`/api/arcade/leaderboard?period=${period}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Leaderboard gagal dimuat.');
        return data.entries;
      })
      .then((data) => {
        if (active) setEntries(data);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || 'Tidak dapat memuat leaderboard.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [period]);

  function changePeriod(nextPeriod) {
    if (nextPeriod === period) return;
    setLoading(true);
    setError('');
    setPeriod(nextPeriod);
  }

  return (
    <div className="arcade-subpage">
      <div className="arcade-page-title">
        <span className="arcade-eyebrow">THE SPOTLIGHT</span>
        <h1>Leaderboard</h1>
        <p>XP dari sesi game yang sudah tervalidasi. Hanya pemain terdaftar yang muncul di sini.</p>
      </div>
      <div className="arcade-tab-switch" role="tablist" aria-label="Leaderboard period">
        <button aria-selected={period === 'weekly'} onClick={() => changePeriod('weekly')} role="tab" type="button">This week</button>
        <button aria-selected={period === 'all-time'} onClick={() => changePeriod('all-time')} role="tab" type="button">All time</button>
      </div>
      <section className="arcade-table-panel">
        {loading ? <p className="arcade-state-message">Memuat leaderboard...</p> : null}
        {error ? <p className="arcade-error" role="alert">{error}</p> : null}
        {!loading && !error && entries.length === 0 ? (
          <div className="arcade-empty-state"><span className="arcade-empty-icon">00</span><p>Belum ada skor tersimpan untuk periode ini. Jadilah yang pertama bermain.</p></div>
        ) : null}
        {!loading && !error && entries.length > 0 ? (
          <>
            <div className="arcade-leaderboard-head"><span>RANK / PLAYER</span><span>LEVEL</span><span>GAMES</span><span>XP</span></div>
            {entries.map((player) => (
              <div className={`arcade-leaderboard-row ${player.rank <= 3 ? `rank-${player.rank}` : ''}`} key={player.username}>
                <div className="arcade-rank-player">
                  <span className="arcade-rank-number">{String(player.rank).padStart(2, '0')}</span>
                  <span><Link href={`/u/${player.username}`}>{player.displayName}</Link><small>@{player.username}</small></span>
                </div>
                <span className="arcade-leaderboard-level">LVL {player.level}</span>
                <span className="arcade-leaderboard-games">{player.gamesPlayed}</span>
                <strong className="arcade-leaderboard-xp">{Number(player.xp).toLocaleString()}</strong>
              </div>
            ))}
          </>
        ) : null}
      </section>
      <p className="arcade-data-note">Leaderboard mingguan dihitung dari XP yang diperoleh sejak Senin 00:00 UTC. Data pemain tidak dibuat atau diisi secara manual.</p>
    </div>
  );
}
