/**
 * Shared, pure formatting helpers for the Ledger of Fate.
 *
 * Lives in its own module so the on-screen components and the share-card
 * image renderer use one source of truth and cannot drift apart.
 */

import type { DraftPot } from '@/data/draftPots';

export const POT_LABEL: Record<DraftPot, string> = {
  1: 'Top Seed',
  2: 'Contender',
  3: 'Dark Horse',
  4: 'Long Shot',
};

/** "1st", "2nd", "3rd", "11th" ... */
export function ordinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] ?? s[v] ?? s[0]!;
}

/** Signed, one-decimal: "+12.4" / "-3.0" / "0.0". */
export function fmtSigned(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  return rounded > 0 ? `+${rounded.toFixed(1)}` : rounded.toFixed(1);
}
