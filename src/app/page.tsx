import { loadSweepstakeData } from '@/lib/load-data';
import HomeClient from './HomeClient';

/**
 * ISR: this only governs the *first* server-rendered paint. Once mounted,
 * HomeClient polls `/api/live` every 25s for true live updates (see
 * `use-live-data.ts`), so freshness no longer depends on page regeneration
 * or on a visitor happening to request the page. We keep a short window so
 * the initial HTML is never badly stale on a cold load.
 */
export const revalidate = 30;

export default async function Page() {
  const data = await loadSweepstakeData();

  return <HomeClient data={data} />;
}
