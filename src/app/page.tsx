import { loadSweepstakeData } from '@/lib/load-data';
import HomeClient from './HomeClient';

/**
 * ISR: Rebuild the page every 60 seconds.
 *
 * During the tournament, this means scores update within a minute
 * of a goal being scored. Pre-tournament, static data is served
 * instantly from the edge cache.
 *
 * Bump to 30 during live matches, or 300 between match days.
 */
export const revalidate = 60;

export default async function Page() {
  const data = await loadSweepstakeData();

  return <HomeClient data={data} />;
}
