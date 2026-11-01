import Link from 'next/link';
import ArcadeAccount from './arcade-account';
import { ARCADE_GAMES } from '../../lib/arcade/definitions';

const navigation = [
  { href: '/arcade', label: 'Minigames home', code: 'M' },
  { href: '/arcade/leaderboard', label: 'Leaderboard', code: 'L' },
  { href: '/arcade/statistics', label: 'Your stats', code: 'S' },
];

export default function ArcadeShell({ children }) {
  return (
    <div className="arcade-app">
      <aside className="arcade-sidebar">
        <Link className="arcade-brand" href="/arcade" aria-label="Filra Minigames home">
          <span className="arcade-brand-mark">F</span>
          <span>FILRA <b>MINIGAMES</b></span>
        </Link>
        <p className="arcade-sidebar-label">PLAY</p>
        <nav className="arcade-nav" aria-label="Minigames navigation">
          {navigation.map((item) => (
            <Link href={item.href} className="arcade-nav-link" key={item.href}>
              <span className="arcade-nav-code">{item.code}</span>{item.label}
            </Link>
          ))}
        </nav>
        <p className="arcade-sidebar-label">GAMES</p>
        <nav className="arcade-nav" aria-label="Mini games">
          {ARCADE_GAMES.map((game) => (
            <Link href={game.href} className="arcade-nav-link" key={game.key}>
              <span className={`arcade-nav-code accent-${game.accent}`}>{game.icon}</span>{game.title}
            </Link>
          ))}
        </nav>
        <div className="arcade-sidebar-bottom">
          <p>A cinematic playground for movie lovers.</p>
          <Link href="/">Back to Filra</Link>
        </div>
      </aside>
      <div className="arcade-stage">
        <header className="arcade-topbar">
          <div className="arcade-mobile-brand">
            <span className="arcade-brand-mark">F</span> MINIGAMES
          </div>
          <span className="arcade-topbar-caption">A CINEMATIC PLAYGROUND FOR MOVIE LOVERS</span>
          <ArcadeAccount />
        </header>
        <main className="arcade-main">{children}</main>
        <footer className="arcade-footer">
          <span>FILRA MINIGAMES</span>
          <span>Movie data and images by TMDB</span>
        </footer>
      </div>
    </div>
  );
}
