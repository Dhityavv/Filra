import ArcadeGame from '../../../../components/arcade/arcade-game';

export default async function MovieWordlePage({ searchParams }) {
  const query = await searchParams;
  return <ArcadeGame gameKey="movie-wordle" initialMode={query?.mode || ''} />;
}
