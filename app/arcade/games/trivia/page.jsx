import ArcadeGame from '../../../../components/arcade/arcade-game';

export default async function TriviaPage({ searchParams }) {
  const query = await searchParams;
  return <ArcadeGame gameKey="trivia" initialMode={query?.mode || ''} />;
}
