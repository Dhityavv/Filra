import ArcadeGame from '../../../../components/arcade/arcade-game';

export default async function MinigamesEmojiPage({ searchParams }) {
  const query = await searchParams;
  return <ArcadeGame gameKey="emoji" initialMode={query?.mode || ''} />;
}
