import ArcadeDashboard from '../../components/arcade/arcade-dashboard';
import { getArcadeOverview } from '../../lib/arcade/engine';

export const dynamic = 'force-dynamic';

export default async function ArcadeHomePage() {
  let overview = null;
  let error = '';
  try {
    overview = await getArcadeOverview();
  } catch (loadError) {
    if (loadError.message !== 'Supabase belum dikonfigurasi di server.') {
      console.error('Failed to load Arcade dashboard:', loadError);
    }
    error = loadError.message || 'Data Arcade belum bisa dimuat.';
  }
  return <ArcadeDashboard error={error} overview={overview} />;
}
