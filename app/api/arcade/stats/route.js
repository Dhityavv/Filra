import { getArcadeStats } from '../../../../lib/arcade/engine';

export async function GET() {
  return getArcadeStats();
}
