/**
 * Draft Database — JSON file-based persistence
 *
 * Stores the draft ceremony state in data/draft.json.
 * All 48 teams across 12 groups assigned to 12 players across 4 rounds.
 */

import { GROUPS } from '@/data/groups';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'data');
const DB_PATH = join(DATA_DIR, 'draft.json');

export type Assignment = {
  player: string;
  team: string;
  group: string;
  round: number;
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
function getAllTeamsWithGroups(): { team: string; group: string }[] {
  return Object.entries(GROUPS).flatMap(([group, teams]) => teams.map((team) => ({ team, group })));
}

/** All 48 team names */
function getAllTeamNames(): string[] {
  return Object.values(GROUPS).flat();
}

/** Default starting state */
function getDefaultState(): DraftState {
  return {
    status: 'pending',
    currentRound: 0,
    currentPick: 0,
    playerOrder: [],
    assignments: [],
    availableTeams: getAllTeamNames(),
  };
}

/** Fisher-Yates shuffle */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Read current state from disk */
export function getDraftState(): DraftState {
  if (!existsSync(DB_PATH)) return getDefaultState();
  try {
    return JSON.parse(readFileSync(DB_PATH, 'utf-8'));
  } catch {
    return getDefaultState();
  }
}

/** Write state to disk */
export function saveDraftState(state: DraftState): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(DB_PATH, JSON.stringify(state, null, 2));
}

/** Check if draft is locked (for use by the main app) */
export function isDraftLocked(): boolean {
  return getDraftState().status === 'locked';
}

/** Get locked assignments as participant format (for main app integration) */
export function getLockedAssignments(): { name: string; teams: string[] }[] | null {
  const state = getDraftState();
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
export function startDraft(): DraftState {
  const state = getDefaultState();
  state.status = 'drafting';
  state.currentRound = 0;
  state.currentPick = 0;
  state.playerOrder = shuffle(PLAYER_NAMES);
  saveDraftState(state);
  return state;
}

/** Draw the next team — assigns a random available team to the current player */
export function drawNext(): { state: DraftState; drawn: Assignment } {
  const state = getDraftState();
  if (state.status !== 'drafting') throw new Error('Not in drafting phase');
  if (state.availableTeams.length === 0) throw new Error('No teams left');

  const player = state.playerOrder[state.currentPick];
  const allWithGroups = getAllTeamsWithGroups();

  // Pick a random available team
  const shuffled = shuffle(state.availableTeams);
  const teamName = shuffled[0];
  const teamInfo = allWithGroups.find((t) => t.team === teamName)!;

  const assignment: Assignment = {
    player,
    team: teamInfo.team,
    group: teamInfo.group,
    round: state.currentRound,
  };

  state.assignments.push(assignment);
  state.availableTeams = state.availableTeams.filter((t) => t !== teamName);

  // Advance pick
  state.currentPick++;

  // If round complete, advance to next round
  if (state.currentPick >= PLAYER_NAMES.length) {
    state.currentRound++;
    state.currentPick = 0;
    state.playerOrder = shuffle(PLAYER_NAMES);

    // If all 4 rounds done, move to trading
    if (state.currentRound >= 4) {
      state.status = 'trading';
    }
  }

  saveDraftState(state);
  return { state, drawn: assignment };
}

/** Trade two teams between two players */
export function tradePlayers(
  player1: string,
  team1: string,
  player2: string,
  team2: string
): DraftState {
  const state = getDraftState();
  if (state.status !== 'trading') throw new Error('Not in trading phase');

  const a1 = state.assignments.find((a) => a.player === player1 && a.team === team1);
  const a2 = state.assignments.find((a) => a.player === player2 && a.team === team2);

  if (!a1 || !a2) throw new Error('Assignment not found');

  // Swap
  a1.player = player2;
  a2.player = player1;

  saveDraftState(state);
  return state;
}

/** Lock the draft — finalize assignments */
export function lockDraft(): DraftState {
  const state = getDraftState();
  if (state.status !== 'trading') throw new Error('Not in trading phase');
  state.status = 'locked';
  saveDraftState(state);
  return state;
}

/** Reset draft completely (for testing) */
export function resetDraft(): DraftState {
  const state = getDefaultState();
  saveDraftState(state);
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
      // Find team names in conflicting groups
      const conflictTeams = teams.filter((t) => duplicates.includes(t.group)).map((t) => t.team);
      result.push({ player, conflicts: conflictTeams });
    }
  }

  return result;
}
