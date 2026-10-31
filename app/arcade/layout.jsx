import ArcadeShell from '../../components/arcade/arcade-shell';
import './arcade.css';

export const metadata = {
  title: 'Filra Arcade - A cinematic playground',
  description: 'Mainkan mini game film, raih XP, dan bersaing di Filra Arcade.',
};

export default function ArcadeLayout({ children }) {
  return <ArcadeShell>{children}</ArcadeShell>;
}
