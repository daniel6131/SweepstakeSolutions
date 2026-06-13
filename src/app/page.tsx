import { after } from 'next/server';

import { getSnapshotForRead } from '@/lib/refresh-snapshot';
import HomeClient from './HomeClient';

/**
 * The first paint reads the SAME canonical snapshot from KV that `/api/live`
 * serves, so every device starts from identical data (no per-device compute).
 * Rendered per-request (a fast KV read) rather than ISR, so a freshly-opened
 * page is never stale; if the snapshot has aged out, `getSnapshotForRead`
 * refreshes it (inline when very stale, in the background otherwise).
 */
export const dynamic = 'force-dynamic';

export default async function Page() {
  const { snapshot, background } = await getSnapshotForRead();
  if (background) after(background);

  return <HomeClient data={snapshot.data} />;
}
