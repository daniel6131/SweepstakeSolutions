/**
 * Draft Database — persistence layer
 *
 * Uses Vercel KV in production (when KV_REST_API_URL is set).
 * Falls back to JSON file in development for local iteration.
 *
 * All 48 tournament teams across 12 groups assigned to 12 players across 4 rounds.
 */

import { getPotForRound, getPotForTeam } from '@/data/draftPots';
import { GROUPS, getAllTeams } from '@/data/groups';
import type { TournamentGroups } from '@/types';
import type { DraftPot } from '@/data/draftPots';

const KV_KEY = 'draft:state';
const isKVEnabled = (): boolean => Boolean(process.env.KV_REST_API_URL);

export type Assignment = {
  player: string;
  team: string;
  group: string;
  round: number;
  pot: DraftPot;
};

export type DraftStatus = 'pending' | 'drafting' | 'trading' | 'locked';

export type DraftState = {
  status: DraftStatus;
  currentRound: number; // 0–3 (4 rounds total)
  currentPick: number; // 0–11 (12 picks per round)
  playerOrder: string[]; // shuffled player order for current round
  assignments: Assignment[];
  availableTeams: string[];
};

/** All 48 teams with their group mapping */
function getAllTeamsWithGroups(
  groups: TournamentGroups = GROUPS
): { team: string; group: string }[] {
  return Object.entries(groups).flatMap(([group, teams]) => teams.map((team) => ({ team, group })));
}

/** All 48 team names */
function getAllTeamNames(groups: TournamentGroups = GROUPS): string[] {
  return getAllTeams(groups);
}

function normalizeDraftState(state: DraftState, groups: TournamentGroups): DraftState {
  const teamToGroup = new Map(
    getAllTeamsWithGroups(groups).map(({ team, group }) => [team, group])
  );
  const assignments = state.assignments.map((assignment) => ({
    ...assignment,
    group: teamToGroup.get(assignment.team) ?? assignment.group,
    pot: getPotForTeam(assignment.team) ?? assignment.pot ?? 1,
  }));
  const assignedTeams = new Set(assignments.map((assignment) => assignment.team));
  const availableTeams = getAllTeamNames(groups).filter((team) => !assignedTeams.has(team));

  return { ...state, assignments, availableTeams };
}

/** Default starting state */
function getDefaultState(groups: TournamentGroups = GROUPS): DraftState {
  return {
    status: 'pending',
    currentRound: 0,
    currentPick: 0,
    playerOrder: [],
    assignments: [],
    availableTeams: getAllTeamNames(groups),
  };
}

/** Fisher-Yates shuffle */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j] as T, a[i] as T];
  }
  return a;
}

/* ── Storage adapters ─────────────────────────────────────── */

async function readState(): Promise<DraftState | null> {
  if (isKVEnabled()) {
    const { kv } = await import('@vercel/kv');
    return kv.get<DraftState>(KV_KEY);
  }
  // Filesystem fallback for local development
  const { existsSync, readFileSync } = await import('fs');
  const { join } = await import('path');
  const dbPath = join(process.cwd(), 'data', 'draft.json');
  if (!existsSync(dbPath)) return null;
  try {
    return JSON.parse(readFileSync(dbPath, 'utf-8')) as DraftState;
  } catch {
    return null;
  }
}

async function writeState(state: DraftState): Promise<void> {
  if (isKVEnabled()) {
    const { kv } = await import('@vercel/kv');
    await kv.set(KV_KEY, state);
    return;
  }
  // Filesystem fallback for local development
  const { existsSync, mkdirSync, writeFileSync } = await import('fs');
  const { join } = await import('path');
  const dataDir = join(process.cwd(), 'data');
  const dbPath = join(dataDir, 'draft.json');
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  writeFileSync(dbPath, JSON.stringify(state, null, 2));
}

/* ── Public API ───────────────────────────────────────────── */

/** Read current state */
export async function getDraftState(groups: TournamentGroups = GROUPS): Promise<DraftState> {
  const raw = await readState();
  if (!raw) return getDefaultState(groups);
  return normalizeDraftState(raw, groups);
}

/** Write state */
export async function saveDraftState(state: DraftState): Promise<void> {
  await writeState(state);
}

/** Check if draft is locked (for use by the main app) */
export async function isDraftLocked(): Promise<boolean> {
  const state = await getDraftState();
  return state.status === 'locked';
}

/** Get locked assignments as participant format (for main app integration) */
export async function getLockedAssignments(): Promise<{ name: string; teams: string[] }[] | null> {
  const state = await getDraftState();
  if (state.status !== 'locked') return null;

  const playerTeams = new Map<string, string[]>();
  for (const a of state.assignments) {
    if (!playerTeams.has(a.player)) playerTeams.set(a.player, []);
    playerTeams.get(a.player)!.push(a.team);
  }

  return Array.from(playerTeams.entries()).map(([name, teams]) => ({ name, teams }));
}

/* ── Draft actions ─────────────────────────────────────────── */

const PLAYER_NAMES = [
  'Adam',
  'Daniel',
  'Little John',
  'Abdul',
  'Michael',
  'Big John',
  'Nathan',
  'Tui',
  'Steff',
  'Nick',
  'Heather',
  'John P',
];

/** Start the draft — move from pending → drafting, shuffle first round order */
export async function startDraft(groups: TournamentGroups = GROUPS): Promise<DraftState> {
  const state = getDefaultState(groups);
  state.status = 'drafting';
  state.currentRound = 0;
  state.currentPick = 0;
  state.playerOrder = shuffle(PLAYER_NAMES);
  await saveDraftState(state);
  return state;
}

/** Draw the next team — assigns a random available team to the current player */
export async function drawNext(groups: TournamentGroups = GROUPS): Promise<{
  state: DraftState;
  drawn: Assignment;
}> {
  const state = await getDraftState(groups);
  if (state.status !== 'drafting') throw new Error('Not in drafting phase');
  if (state.availableTeams.length === 0) throw new Error('No teams left');

  const player = state.playerOrder[state.currentPick];
  const allWithGroups = getAllTeamsWithGroups(groups);
  const currentPot = getPotForRound(state.currentRound);

  if (!currentPot) throw new Error(`No pot configured for round ${state.currentRound + 1}`);

  const currentPotTeams = state.availableTeams.filter((team) => getPotForTeam(team) === currentPot);
  if (currentPotTeams.length === 0) {
    throw new Error(`No teams left in pot ${currentPot}`);
  }

  const shuffled = shuffle(currentPotTeams);
  const teamName = shuffled[0];
  if (!teamName) throw new Error('Failed to draw a team');
  const teamInfo = allWithGroups.find((t) => t.team === teamName);
  if (!teamInfo) throw new Error(`Team not found: ${teamName}`);

  const assignment: Assignment = {
    player: player ?? '',
    team: teamInfo.team,
    group: teamInfo.group,
    round: state.currentRound,
    pot: currentPot,
  };

  state.assignments.push(assignment);
  state.availableTeams = state.availableTeams.filter((t) => t !== teamName);
  state.currentPick++;

  if (state.currentPick >= PLAYER_NAMES.length) {
    state.currentRound++;
    state.currentPick = 0;
    state.playerOrder = shuffle(PLAYER_NAMES);
    if (state.currentRound >= 4) {
      state.status = 'trading';
    }
  }

  await saveDraftState(state);
  return { state, drawn: assignment };
}

/** Trade two teams between two players */
export async function tradePlayers(
  player1: string,
  team1: string,
  player2: string,
  team2: string
): Promise<DraftState> {
  const state = await getDraftState();
  if (state.status !== 'trading') throw new Error('Not in trading phase');

  const a1 = state.assignments.find((a) => a.player === player1 && a.team === team1);
  const a2 = state.assignments.find((a) => a.player === player2 && a.team === team2);

  if (!a1 || !a2) throw new Error('Assignment not found');

  a1.player = player2;
  a2.player = player1;

  await saveDraftState(state);
  return state;
}

/** Lock the draft — finalize assignments */
export async function lockDraft(): Promise<DraftState> {
  const state = await getDraftState();
  if (state.status !== 'trading') throw new Error('Not in trading phase');
  state.status = 'locked';
  await saveDraftState(state);
  return state;
}

/** Reset draft completely */
export async function resetDraft(groups: TournamentGroups = GROUPS): Promise<DraftState> {
  const state = getDefaultState(groups);
  await saveDraftState(state);
  return state;
}

/** Get group conflicts for a player's assignments */
export function getPlayerConflicts(
  assignments: Assignment[]
): { player: string; conflicts: string[] }[] {
  const playerTeams = new Map<string, Assignment[]>();
  for (const a of assignments) {
    if (!playerTeams.has(a.player)) playerTeams.set(a.player, []);
    playerTeams.get(a.player)!.push(a);
  }

  const result: { player: string; conflicts: string[] }[] = [];
  for (const [player, teams] of playerTeams) {
    const groups = teams.map((t) => t.group);
    const duplicates = groups.filter((g, i) => groups.indexOf(g) !== i);
    if (duplicates.length > 0) {
      const conflictTeams = teams.filter((t) => duplicates.includes(t.group)).map((t) => t.team);
      result.push({ player, conflicts: conflictTeams });
    }
  }

  return result;
}
