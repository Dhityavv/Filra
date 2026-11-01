import ArcadeGame from '../../../../components/arcade/arcade-game';

export default async function MinigamesGuessMoviePage({ searchParams }) {
  const query = await searchParams;
  return <ArcadeGame gameKey="guess-movie" initialMode={query?.mode || ''} />;
}
