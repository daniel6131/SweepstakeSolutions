/**
 * TEMPORARY demo helper — overlays realistic mock standings onto the real
 * participants (keeps their names + assigned teams, just adds scores) so the
 * leaderboard can be previewed populated before the tournament starts.
 *
 * Activated via the `?demo` query param in HomeClient. Safe to delete this
 * file and the `demo` wiring in HomeClient once previewing is done.
 */
import type { LeaderboardEntry } from '@/types';

const MOCK_RECORDS = [
  { pts: 14, w: 4, d: 2, l: 0, gd: 9 },
  { pts: 12, w: 3, d: 3, l: 0, gd: 6 },
  { pts: 11, w: 3, d: 2, l: 1, gd: 4 },
  { pts: 9, w: 2, d: 3, l: 1, gd: 3 },
  { pts: 8, w: 2, d: 2, l: 2, gd: 1 },
  { pts: 7, w: 2, d: 1, l: 3, gd: 0 },
  { pts: 7, w: 2, d: 1, l: 3, gd: -1 },
  { pts: 5, w: 1, d: 2, l: 3, gd: -3 },
  { pts: 4, w: 1, d: 1, l: 4, gd: -5 },
  { pts: 4, w: 1, d: 1, l: 4, gd: -6 },
  { pts: 2, w: 0, d: 2, l: 4, gd: -7 },
  { pts: 1, w: 0, d: 1, l: 5, gd: -9 },
];

export function mockLeaderboard(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return entries.map((entry, i) => {
    const m = MOCK_RECORDS[i % MOCK_RECORDS.length];
    return { ...entry, pts: m.pts, w: m.w, d: m.d, l: m.l, gf: 10, ga: 10 - m.gd, gd: m.gd };
  });
}
