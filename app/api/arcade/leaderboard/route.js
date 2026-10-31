import { getLeaderboard } from '../../../../lib/arcade/engine';

export async function GET(request) {
  const period = new URL(request.url).searchParams.get('period') || 'weekly';
  return getLeaderboard(period);
}
