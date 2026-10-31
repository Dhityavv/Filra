import ArcadeGame from '../../../../components/arcade/arcade-game';

export default async function EmojiPage({ searchParams }) {
  const query = await searchParams;
  return <ArcadeGame gameKey="emoji" initialMode={query?.mode || ''} />;
}
