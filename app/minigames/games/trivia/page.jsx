import ArcadeGame from '../../../../components/arcade/arcade-game';

export default async function MinigamesTriviaPage({ searchParams }) {
  const query = await searchParams;
  return <ArcadeGame gameKey="trivia" initialMode={query?.mode || ''} />;
}
