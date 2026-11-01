import ArcadeGame from '../../../../components/arcade/arcade-game';

export default async function MinigamesHigherLowerPage({ searchParams }) {
  const query = await searchParams;
  return <ArcadeGame gameKey="higher-lower" initialMode={query?.mode || ''} />;
}
