import ArcadeShell from '../../components/arcade/arcade-shell';
import './arcade.css';

export const metadata = {
  title: 'Filra Minigames - A cinematic playground',
  description: 'Mainkan mini game film, raih XP, dan bersaing di Filra Minigames.',
};

export default function ArcadeLayout({ children }) {
  return <ArcadeShell>{children}</ArcadeShell>;
}
