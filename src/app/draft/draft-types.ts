import { COUNTRY_CODES } from '@/data/countryCodes';
import type { DraftPot } from '@/data/draftPots';

export type Assignment = {
  player: string;
  team: string;
  group: string;
  round: number;
  pot: DraftPot;
};
export type Conflict = { player: string; conflicts: string[] };

export type DraftState = {
  status: 'pending' | 'drafting' | 'trading' | 'locked';
  currentRound: number;
  currentPick: number;
  playerOrder: string[];
  assignments: Assignment[];
  availableTeams: string[];
  conflicts?: Conflict[];
  lastDrawn?: Assignment;
};

export type DrawPhase =
  | 'idle'
  | 'spinning'
  | 'charging'
  | 'decelerating'
  | 'wobbling'
  | 'locking'
  | 'revealing'
  | 'dealt';

export const C = {
  bg: '#030d10',
  accent: '#94FFE4',
  accent2: '#06D6A0',
  card: '#071418',
  danger: '#FF6B6B',
  gold: '#FFD60A',
} as const;

const FLAG_WIDTHS = [20, 40, 80, 160, 320, 640, 1280] as const;

function supportedFlagWidth(size: number): number {
  return FLAG_WIDTHS.find((width) => size <= width) ?? FLAG_WIDTHS[FLAG_WIDTHS.length - 1];
}

export function flagUrl(team: string, size = 80): string {
  const code = COUNTRY_CODES[team] ?? '';
  return `https://flagcdn.com/w${supportedFlagWidth(size)}/${code}.png`;
}

export function getPlayerTeams(assignments: Assignment[], player: string) {
  return assignments.filter((a) => a.player === player);
}

export function isConflictTeam(conflicts: Conflict[], player: string, team: string): boolean {
  const c = conflicts.find((x) => x.player === player);
  return c ? c.conflicts.includes(team) : false;
}

export function mulberry32(seed: number): () => number {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleWithSeed<T>(list: T[], seed: number): T[] {
  const rand = mulberry32(seed);
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function teamHue(team: string): number {
  let h = 0;
  for (let i = 0; i < team.length; i++) h = (h * 31 + team.charCodeAt(i)) & 0xffff;
  return h % 360;
}

export function formatPotLabel(pot: DraftPot | null): string {
  return pot ? `Pot ${pot}` : 'Pot TBC';
}

export async function draftApi(
  action?: string,
  params?: Record<string, string>
): Promise<DraftState> {
  if (!action) return fetch('/api/draft').then((r) => r.json());
  return fetch('/api/draft', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...params }),
  }).then((r) => r.json());
}
