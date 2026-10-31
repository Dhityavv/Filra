import ArcadeGame from '../../../../components/arcade/arcade-game';

export default async function GuessMoviePage({ searchParams }) {
  const query = await searchParams;
  return <ArcadeGame gameKey="guess-movie" initialMode={query?.mode || ''} />;
}
