import PublicProfile from '../../../components/public-profile';

export default async function Page({ params }) {
  const { username } = await params;
  return <PublicProfile username={username} />;
}
