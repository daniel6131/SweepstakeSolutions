import type { ScoringMatch } from '@/lib/scoring';
import type {
  DetailedMatchStatus,
  GroupId,
  GroupStanding,
  KnockoutRoundKey,
  LiveKnockoutMatch,
  MatchStatus,
} from '@/types';

type SeedSlot =
  | { kind: 'winner'; group: GroupId }
  | { kind: 'runnerUp'; group: GroupId }
  | { kind: 'thirdPlace'; eligibleGroups: GroupId[] }
  | { kind: 'winnerMatch'; match: number };

type MatchConfig = {
  match: number;
  roundKey: KnockoutRoundKey;
  date: string;
  venue: string;
  home: SeedSlot;
  away: SeedSlot;
};

export type KnockoutSlot = {
  label: string;
  team: string | null;
  seedLabel: string;
  source: 'winner' | 'runnerUp' | 'thirdPlace' | 'winnerMatch';
  group: GroupId | null;
  status: 'confirmed' | 'projected' | 'placeholder';
  /** On-pitch score (regulation + extra time), never the shootout tally. */
  score: number | null;
  /** Penalty-shootout kicks for this side, when the match went to penalties. */
  pens: number | null;
  isWinner: boolean;
};

export type KnockoutMatch = {
  match: number;
  roundKey: KnockoutRoundKey;
  date: string;
  time: string;
  /** ISO kickoff from the live feed, so the UI can render it in the viewer's
   *  timezone (empty for the pre-tournament projection, which has no fixtures). */
  utcDate: string;
  venue: string;
  home: KnockoutSlot;
  away: KnockoutSlot;
  /** On-pitch scores (regulation + extra time), shootout kicks excluded. */
  homeScore: number | null;
  awayScore: number | null;
  /** Penalty-shootout tally, present only when the match went to penalties. */
  homePens: number | null;
  awayPens: number | null;
  winner: 'home' | 'away' | null;
  /** True only once the match is decided (full time / after pens). A match still
   *  in play, extra time or a shootout is NOT played, so nobody advances yet. */
  isPlayed: boolean;
  isReady: boolean;
  /** Live lifecycle from the feed: scheduled / live / finished. */
  status: MatchStatus;
  /** Raw API status (ET / PENS) for the live-phase label. */
  detailedStatus?: DetailedMatchStatus;
};

export type KnockoutRound = {
  key: KnockoutRoundKey;
  title: string;
  shortTitle: string;
  matches: KnockoutMatch[];
};

export type ThirdPlaceSummary = {
  group: GroupId;
  team: string;
  played: number;
  pts: number;
  gd: number;
  gf: number;
  qualified: boolean;
  status: 'confirmed' | 'projected';
};

export type ProjectedKnockoutBracket = {
  rounds: KnockoutRound[];
  thirdPlaceStandings: ThirdPlaceSummary[];
  completedGroups: number;
  totalGroups: number;
};

export type KnockoutResult = {
  homeScore: number | null;
  awayScore: number | null;
  winner: 'home' | 'away' | null;
  /** Penalty-shootout tally, when the match went to penalties. */
  homePens?: number | null;
  awayPens?: number | null;
  /** Whether the match is decided (finished). Defaults to "both scores present"
   *  for manually entered results; the live builder sets it false while a match
   *  is still in play, extra time or a shootout, so nobody advances mid-match. */
  decided?: boolean;
  /** Live lifecycle, when this result comes from the live feed. */
  status?: MatchStatus;
  detailedStatus?: DetailedMatchStatus;
};

/** Real values pulled from the live feed for one bracket position, keyed by the
 *  config match number. Lets the live builder overlay the actual teams (fixing a
 *  projected third-place guess), kickoff, and venue onto the canonical bracket
 *  structure without disturbing its ordering. Teams are oriented so `homeTeam`
 *  aligns with the config's home slot. */
export type KnockoutOverride = {
  homeTeam?: string;
  awayTeam?: string;
  date?: string;
  time?: string;
  utcDate?: string;
  venue?: string;
};

const ROUND_TITLES: Record<KnockoutRoundKey, { title: string; shortTitle: string }> = {
  roundOf32: { title: 'Round of 32', shortTitle: 'R32' },
  roundOf16: { title: 'Round of 16', shortTitle: 'R16' },
  quarterFinals: { title: 'Quarter-finals', shortTitle: 'QF' },
  semiFinals: { title: 'Semi-finals', shortTitle: 'SF' },
  final: { title: 'Final', shortTitle: 'Final' },
};

const ROUND_ORDER: KnockoutRoundKey[] = [
  'roundOf32',
  'roundOf16',
  'quarterFinals',
  'semiFinals',
  'final',
];

const MATCHES: MatchConfig[] = [
  {
    match: 73,
    roundKey: 'roundOf32',
    date: 'Sun 28 Jun',
    venue: 'Los Angeles Stadium',
    home: { kind: 'runnerUp', group: 'A' },
    away: { kind: 'runnerUp', group: 'B' },
  },
  {
    match: 74,
    roundKey: 'roundOf32',
    date: 'Mon 29 Jun',
    venue: 'Boston Stadium',
    home: { kind: 'winner', group: 'E' },
    away: { kind: 'thirdPlace', eligibleGroups: ['A', 'B', 'C', 'D', 'F'] },
  },
  {
    match: 75,
    roundKey: 'roundOf32',
    date: 'Mon 29 Jun',
    venue: 'Estadio Monterrey',
    home: { kind: 'winner', group: 'F' },
    away: { kind: 'runnerUp', group: 'C' },
  },
  {
    match: 76,
    roundKey: 'roundOf32',
    date: 'Mon 29 Jun',
    venue: 'Houston Stadium',
    home: { kind: 'winner', group: 'C' },
    away: { kind: 'runnerUp', group: 'F' },
  },
  {
    match: 77,
    roundKey: 'roundOf32',
    date: 'Tue 30 Jun',
    venue: 'New York New Jersey Stadium',
    home: { kind: 'winner', group: 'I' },
    away: { kind: 'thirdPlace', eligibleGroups: ['C', 'D', 'F', 'G', 'H'] },
  },
  {
    match: 78,
    roundKey: 'roundOf32',
    date: 'Tue 30 Jun',
    venue: 'Dallas Stadium',
    home: { kind: 'runnerUp', group: 'E' },
    away: { kind: 'runnerUp', group: 'I' },
  },
  {
    match: 79,
    roundKey: 'roundOf32',
    date: 'Tue 30 Jun',
    venue: 'Mexico City Stadium',
    home: { kind: 'winner', group: 'A' },
    away: { kind: 'thirdPlace', eligibleGroups: ['C', 'E', 'F', 'H', 'I'] },
  },
  {
    match: 80,
    roundKey: 'roundOf32',
    date: 'Wed 1 Jul',
    venue: 'Atlanta Stadium',
    home: { kind: 'winner', group: 'L' },
    away: { kind: 'thirdPlace', eligibleGroups: ['E', 'H', 'I', 'J', 'K'] },
  },
  {
    match: 81,
    roundKey: 'roundOf32',
    date: 'Wed 1 Jul',
    venue: 'San Francisco Bay Area Stadium',
    home: { kind: 'winner', group: 'D' },
    away: { kind: 'thirdPlace', eligibleGroups: ['B', 'E', 'F', 'I', 'J'] },
  },
  {
    match: 82,
    roundKey: 'roundOf32',
    date: 'Wed 1 Jul',
    venue: 'Seattle Stadium',
    home: { kind: 'winner', group: 'G' },
    away: { kind: 'thirdPlace', eligibleGroups: ['A', 'E', 'H', 'I', 'J'] },
  },
  {
    match: 83,
    roundKey: 'roundOf32',
    date: 'Thu 2 Jul',
    venue: 'Toronto Stadium',
    home: { kind: 'runnerUp', group: 'K' },
    away: { kind: 'runnerUp', group: 'L' },
  },
  {
    match: 84,
    roundKey: 'roundOf32',
    date: 'Thu 2 Jul',
    venue: 'Los Angeles Stadium',
    home: { kind: 'winner', group: 'H' },
    away: { kind: 'runnerUp', group: 'J' },
  },
  {
    match: 85,
    roundKey: 'roundOf32',
    date: 'Thu 2 Jul',
    venue: 'BC Place Vancouver',
    home: { kind: 'winner', group: 'B' },
    away: { kind: 'thirdPlace', eligibleGroups: ['E', 'F', 'G', 'I', 'J'] },
  },
  {
    match: 86,
    roundKey: 'roundOf32',
    date: 'Fri 3 Jul',
    venue: 'Miami Stadium',
    home: { kind: 'winner', group: 'J' },
    away: { kind: 'runnerUp', group: 'H' },
  },
  {
    match: 87,
    roundKey: 'roundOf32',
    date: 'Fri 3 Jul',
    venue: 'Kansas City Stadium',
    home: { kind: 'winner', group: 'K' },
    away: { kind: 'thirdPlace', eligibleGroups: ['D', 'E', 'I', 'J', 'L'] },
  },
  {
    match: 88,
    roundKey: 'roundOf32',
    date: 'Fri 3 Jul',
    venue: 'Dallas Stadium',
    home: { kind: 'runnerUp', group: 'D' },
    away: { kind: 'runnerUp', group: 'G' },
  },
  {
    match: 89,
    roundKey: 'roundOf16',
    date: 'Sat 4 Jul',
    venue: 'Philadelphia Stadium',
    home: { kind: 'winnerMatch', match: 74 },
    away: { kind: 'winnerMatch', match: 77 },
  },
  {
    match: 90,
    roundKey: 'roundOf16',
    date: 'Sat 4 Jul',
    venue: 'Houston Stadium',
    home: { kind: 'winnerMatch', match: 73 },
    away: { kind: 'winnerMatch', match: 75 },
  },
  {
    match: 91,
    roundKey: 'roundOf16',
    date: 'Sun 5 Jul',
    venue: 'New York New Jersey Stadium',
    home: { kind: 'winnerMatch', match: 76 },
    away: { kind: 'winnerMatch', match: 78 },
  },
  {
    match: 92,
    roundKey: 'roundOf16',
    date: 'Sun 5 Jul',
    venue: 'Estadio Azteca',
    home: { kind: 'winnerMatch', match: 79 },
    away: { kind: 'winnerMatch', match: 80 },
  },
  {
    match: 93,
    roundKey: 'roundOf16',
    date: 'Mon 6 Jul',
    venue: 'Dallas Stadium',
    home: { kind: 'winnerMatch', match: 83 },
    away: { kind: 'winnerMatch', match: 84 },
  },
  {
    match: 94,
    roundKey: 'roundOf16',
    date: 'Mon 6 Jul',
    venue: 'Seattle Stadium',
    home: { kind: 'winnerMatch', match: 81 },
    away: { kind: 'winnerMatch', match: 82 },
  },
  {
    match: 95,
    roundKey: 'roundOf16',
    date: 'Tue 7 Jul',
    venue: 'Atlanta Stadium',
    home: { kind: 'winnerMatch', match: 86 },
    away: { kind: 'winnerMatch', match: 88 },
  },
  {
    match: 96,
    roundKey: 'roundOf16',
    date: 'Tue 7 Jul',
    venue: 'BC Place Vancouver',
    home: { kind: 'winnerMatch', match: 85 },
    away: { kind: 'winnerMatch', match: 87 },
  },
  {
    match: 97,
    roundKey: 'quarterFinals',
    date: 'Thu 9 Jul',
    venue: 'Boston Stadium',
    home: { kind: 'winnerMatch', match: 89 },
    away: { kind: 'winnerMatch', match: 90 },
  },
  {
    match: 98,
    roundKey: 'quarterFinals',
    date: 'Fri 10 Jul',
    venue: 'Los Angeles Stadium',
    home: { kind: 'winnerMatch', match: 93 },
    away: { kind: 'winnerMatch', match: 94 },
  },
  {
    match: 99,
    roundKey: 'quarterFinals',
    date: 'Sat 11 Jul',
    venue: 'Miami Stadium',
    home: { kind: 'winnerMatch', match: 91 },
    away: { kind: 'winnerMatch', match: 92 },
  },
  {
    match: 100,
    roundKey: 'quarterFinals',
    date: 'Sat 11 Jul',
    venue: 'Kansas City Stadium',
    home: { kind: 'winnerMatch', match: 95 },
    away: { kind: 'winnerMatch', match: 96 },
  },
  {
    match: 101,
    roundKey: 'semiFinals',
    date: 'Tue 14 Jul',
    venue: 'Dallas Stadium',
    home: { kind: 'winnerMatch', match: 97 },
    away: { kind: 'winnerMatch', match: 98 },
  },
  {
    match: 102,
    roundKey: 'semiFinals',
    date: 'Wed 15 Jul',
    venue: 'Atlanta Stadium',
    home: { kind: 'winnerMatch', match: 99 },
    away: { kind: 'winnerMatch', match: 100 },
  },
  {
    match: 104,
    roundKey: 'final',
    date: 'Sun 19 Jul',
    venue: 'New York New Jersey Stadium',
    home: { kind: 'winnerMatch', match: 101 },
    away: { kind: 'winnerMatch', match: 102 },
  },
];

const MATCH_BY_NUMBER = new Map<number, MatchConfig>(MATCHES.map((match) => [match.match, match]));

/**
 * Top-to-bottom bracket order, keyed by match number.
 *
 * The renderer (and `buildLayout`) draw the tree by pairing each round's
 * adjacent matches, `matches[2i]` and `matches[2i+1]`, into the next round's
 * `matches[i]`. So every round's array MUST be in bracket-tree order, not match
 * number order and not kickoff order, or the connectors, halves and seeding all
 * come out wrong (the bug where two teams from opposite halves appeared to meet
 * early). We derive that order once from the config's winner-feeds links via an
 * in-order walk of the tree rooted at the final: visit a match's home-feeder
 * subtree, then the match, then its away-feeder subtree. Sorting each round by
 * the resulting rank interleaves the matches exactly as the bracket nests them.
 */
const BRACKET_ORDER: Map<number, number> = (() => {
  const rank = new Map<number, number>();
  let counter = 0;

  const visit = (matchNumber: number): void => {
    const config = MATCH_BY_NUMBER.get(matchNumber);
    if (!config) return;
    const homeFeeder = config.home.kind === 'winnerMatch' ? config.home.match : null;
    const awayFeeder = config.away.kind === 'winnerMatch' ? config.away.match : null;
    if (homeFeeder !== null) visit(homeFeeder);
    rank.set(matchNumber, counter++);
    if (awayFeeder !== null) visit(awayFeeder);
  };

  const finalMatch = MATCHES.find((match) => match.roundKey === 'final');
  if (finalMatch) visit(finalMatch.match);
  return rank;
})();

function bracketRank(matchNumber: number): number {
  return BRACKET_ORDER.get(matchNumber) ?? matchNumber;
}

function getGroupPlacement(
  standings: Record<GroupId, GroupStanding[]>,
  group: GroupId,
  index: number
): GroupStanding | null {
  return standings[group]?.[index] ?? null;
}

function isGroupComplete(rows: GroupStanding[] | undefined): boolean {
  return Boolean(rows?.length && rows.every((row) => row.p === 3));
}

function rankThirdPlacedTeams(standings: Record<GroupId, GroupStanding[]>): ThirdPlaceSummary[] {
  return (Object.entries(standings) as [GroupId, GroupStanding[]][])
    .map(([group, rows]) => {
      const row = rows[2];
      const gd = row ? row.gf - row.ga : 0;

      return {
        group,
        team: row?.team ?? `Group ${group} third place`,
        played: row?.p ?? 0,
        pts: row?.pts ?? 0,
        gd,
        gf: row?.gf ?? 0,
        qualified: false,
        status: isGroupComplete(rows) ? 'confirmed' : 'projected',
      } satisfies ThirdPlaceSummary;
    })
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.team.localeCompare(b.team))
    .map((row, index) => ({
      ...row,
      qualified: index < 8,
    }));
}

function assignThirdPlaceGroups(qualifiedGroups: GroupId[]): Map<number, GroupId> {
  const pending = MATCHES.filter((match) => match.roundKey === 'roundOf32')
    .flatMap((match) => {
      if (match.home.kind === 'thirdPlace') {
        return [
          {
            match: match.match,
            eligibleGroups: match.home.eligibleGroups.filter((group) =>
              qualifiedGroups.includes(group)
            ),
          },
        ];
      }

      if (match.away.kind === 'thirdPlace') {
        return [
          {
            match: match.match,
            eligibleGroups: match.away.eligibleGroups.filter((group) =>
              qualifiedGroups.includes(group)
            ),
          },
        ];
      }

      return [];
    })
    .sort((a, b) => a.eligibleGroups.length - b.eligibleGroups.length || a.match - b.match);

  const assignment = new Map<number, GroupId>();
  const usedGroups = new Set<GroupId>();

  const backtrack = (index: number): boolean => {
    if (index >= pending.length) return true;

    const current = pending[index];
    const options = qualifiedGroups.filter(
      (group) => current.eligibleGroups.includes(group) && !usedGroups.has(group)
    );

    for (const group of options) {
      assignment.set(current.match, group);
      usedGroups.add(group);

      if (backtrack(index + 1)) {
        return true;
      }

      assignment.delete(current.match);
      usedGroups.delete(group);
    }

    return false;
  };

  return backtrack(0) ? assignment : new Map();
}

function resolveSlot(
  slot: SeedSlot,
  standings: Record<GroupId, GroupStanding[]>,
  thirdPlaceStandings: ThirdPlaceSummary[],
  thirdPlaceAssignments: Map<number, GroupId>,
  currentMatch: number,
  resolvedMatches: Map<number, KnockoutMatch>
): KnockoutSlot {
  if (slot.kind === 'winner') {
    const row = getGroupPlacement(standings, slot.group, 0);

    return {
      label: row?.team ?? `Group ${slot.group} winner`,
      team: row?.team ?? null,
      seedLabel: `${slot.group}1`,
      source: 'winner',
      group: slot.group,
      status: isGroupComplete(standings[slot.group]) ? 'confirmed' : 'projected',
      score: null,
      pens: null,
      isWinner: false,
    };
  }

  if (slot.kind === 'runnerUp') {
    const row = getGroupPlacement(standings, slot.group, 1);

    return {
      label: row?.team ?? `Group ${slot.group} runner-up`,
      team: row?.team ?? null,
      seedLabel: `${slot.group}2`,
      source: 'runnerUp',
      group: slot.group,
      status: isGroupComplete(standings[slot.group]) ? 'confirmed' : 'projected',
      score: null,
      pens: null,
      isWinner: false,
    };
  }

  if (slot.kind === 'thirdPlace') {
    const assignedGroup = thirdPlaceAssignments.get(currentMatch);
    const row = thirdPlaceStandings.find((entry) => entry.group === assignedGroup);

    return {
      label: row?.team ?? 'Best third-place team',
      team: row?.team ?? null,
      seedLabel: assignedGroup ? `3${assignedGroup}` : '3rd',
      source: 'thirdPlace',
      group: assignedGroup ?? null,
      status: 'projected',
      score: null,
      pens: null,
      isWinner: false,
    };
  }

  const previousMatch = resolvedMatches.get(slot.match);
  if (previousMatch?.winner) {
    const winnerSlot = previousMatch[previousMatch.winner];

    return {
      label: winnerSlot.label,
      team: winnerSlot.team,
      seedLabel: `W${slot.match}`,
      source: 'winnerMatch',
      group: winnerSlot.group,
      status: 'confirmed',
      score: null,
      pens: null,
      isWinner: false,
    };
  }

  return {
    label: `Winner Match ${slot.match}`,
    team: null,
    seedLabel: `W${slot.match}`,
    source: 'winnerMatch',
    group: null,
    status: 'placeholder',
    score: null,
    pens: null,
    isWinner: false,
  };
}

/** Rebuild a slot around a known real team (from the live feed), tagged with the
 *  group-stage seed it qualified through. Used to overlay the actual knockout
 *  participants onto the projected bracket structure. */
function applyTeamOverride(
  base: KnockoutSlot,
  team: string,
  standings: Record<GroupId, GroupStanding[]>
): KnockoutSlot {
  const seed = seedForTeam(team, standings);
  return {
    ...base,
    label: team,
    team,
    seedLabel: seed.group ? seed.seedLabel : base.seedLabel,
    source: seed.group ? seed.source : base.source,
    group: seed.group ?? base.group,
    status: 'confirmed',
  };
}

export function buildProjectedKnockoutBracket(
  standings: Record<GroupId, GroupStanding[]>,
  results: Partial<Record<number, KnockoutResult>> = {},
  overrides: Map<number, KnockoutOverride> = new Map()
): ProjectedKnockoutBracket {
  const thirdPlaceStandings = rankThirdPlacedTeams(standings);
  const qualifiedThirdGroups = thirdPlaceStandings
    .filter((entry) => entry.qualified)
    .map((entry) => entry.group);
  const thirdPlaceAssignments = assignThirdPlaceGroups(qualifiedThirdGroups);
  const completedGroups = (Object.values(standings) as GroupStanding[][]).filter((rows) =>
    isGroupComplete(rows)
  ).length;

  const resolvedMatches = new Map<number, KnockoutMatch>();
  const rounds = ROUND_ORDER.map((roundKey) => {
    // Bracket-tree order (not match number order) so adjacent matches pair into
    // the next round correctly — see BRACKET_ORDER. Resolution itself is order
    // independent (a match only feeds off earlier, already-resolved rounds).
    const matches = MATCHES.filter((match) => match.roundKey === roundKey)
      .sort((a, b) => bracketRank(a.match) - bracketRank(b.match))
      .map((match) => {
        const override = overrides.get(match.match);
        let home = resolveSlot(
          match.home,
          standings,
          thirdPlaceStandings,
          thirdPlaceAssignments,
          match.match,
          resolvedMatches
        );
        let away = resolveSlot(
          match.away,
          standings,
          thirdPlaceStandings,
          thirdPlaceAssignments,
          match.match,
          resolvedMatches
        );

        // Overlay the real team from the live feed. This replaces a projected
        // third-place guess (and any placeholder) with the team that actually
        // took the slot, so labels and the team that advances are both correct.
        if (override?.homeTeam) home = applyTeamOverride(home, override.homeTeam, standings);
        if (override?.awayTeam) away = applyTeamOverride(away, override.awayTeam, standings);

        const result = results[match.match];
        const homeScore = result?.homeScore ?? null;
        const awayScore = result?.awayScore ?? null;
        const homePens = result?.homePens ?? null;
        const awayPens = result?.awayPens ?? null;
        const isReady = Boolean(home.team && away.team);
        const hasBothScores = homeScore !== null && awayScore !== null;
        // A result counts as decided only when finished. Manually entered results
        // (no explicit flag) decide as soon as both scores are present, preserving
        // the old behaviour; the live builder passes decided=false while a match
        // is in play, extra time or a shootout so it never advances mid-match.
        const decided = result?.decided ?? hasBothScores;
        // Trust an explicit winner (a shootout is level on the pitch, so the score
        // can't decide it); otherwise fall back to the on-pitch comparison.
        const winner: 'home' | 'away' | null =
          isReady && decided
            ? (result?.winner ??
              (hasBothScores
                ? homeScore > awayScore
                  ? 'home'
                  : awayScore > homeScore
                    ? 'away'
                    : null
                : null))
            : null;
        const status: MatchStatus =
          result?.status ?? (decided && isReady ? 'finished' : 'scheduled');

        const builtMatch: KnockoutMatch = {
          match: match.match,
          roundKey,
          date: override?.date ?? match.date,
          time: override?.time ?? '',
          utcDate: override?.utcDate ?? '',
          venue: override?.venue ?? match.venue,
          home: {
            ...home,
            score: homeScore,
            pens: homePens,
            isWinner: winner === 'home',
          },
          away: {
            ...away,
            score: awayScore,
            pens: awayPens,
            isWinner: winner === 'away',
          },
          homeScore,
          awayScore,
          homePens,
          awayPens,
          winner,
          isPlayed: winner !== null,
          isReady,
          status,
          detailedStatus: result?.detailedStatus,
        };

        resolvedMatches.set(match.match, builtMatch);
        return builtMatch;
      });

    return {
      key: roundKey,
      title: ROUND_TITLES[roundKey].title,
      shortTitle: ROUND_TITLES[roundKey].shortTitle,
      matches,
    };
  });

  return {
    rounds,
    thirdPlaceStandings,
    completedGroups,
    totalGroups: 12,
  };
}

/** Where a team finished its group, for the seed badge (e.g. "A1", "B2", "3C"). */
function seedForTeam(
  team: string,
  standings: Record<GroupId, GroupStanding[]>
): { seedLabel: string; source: KnockoutSlot['source']; group: GroupId | null } {
  for (const [group, rows] of Object.entries(standings) as [GroupId, GroupStanding[]][]) {
    const index = rows.findIndex((row) => row.team === team);
    if (index === 0) return { seedLabel: `${group}1`, source: 'winner', group };
    if (index === 1) return { seedLabel: `${group}2`, source: 'runnerUp', group };
    if (index === 2) return { seedLabel: `3${group}`, source: 'thirdPlace', group };
  }
  return { seedLabel: '', source: 'winnerMatch', group: null };
}

/** A group winner or runner-up — a deterministic Round-of-32 slot (its team is
 *  fixed by the group table). Only the third-place slots are a projection guess,
 *  so a deterministic team is a reliable anchor for placing a live R32 match. */
function isDeterministicTeam(team: string, standings: Record<GroupId, GroupStanding[]>): boolean {
  for (const rows of Object.values(standings) as GroupStanding[][]) {
    const index = rows.findIndex((row) => row.team === team);
    if (index === 0 || index === 1) return true;
  }
  return false;
}

/**
 * Find the config match a live fixture belongs to, within an already-resolved
 * round.
 *
 * R32: anchor on the deterministic team (a group winner/runner-up). Every R32
 * match has at least one, and each appears in exactly one match, so it pins the
 * slot without trusting the projected third-place guess (which the live feed is
 * here to correct). R16+: the upstream winners are already real (overrides have
 * propagated them), so we match on team identity in either orientation.
 */
function findTargetMatch(
  matches: KnockoutMatch[],
  t1: string,
  t2: string,
  roundKey: KnockoutRoundKey,
  standings: Record<GroupId, GroupStanding[]>
): KnockoutMatch | null {
  if (roundKey === 'roundOf32') {
    const anchor = isDeterministicTeam(t1, standings)
      ? t1
      : isDeterministicTeam(t2, standings)
        ? t2
        : null;
    if (!anchor) return null;
    return matches.find((m) => m.home.team === anchor || m.away.team === anchor) ?? null;
  }

  return (
    matches.find(
      (m) =>
        (m.home.team === t1 && m.away.team === t2) || (m.home.team === t2 && m.away.team === t1)
    ) ??
    matches.find(
      (m) => m.home.team === t1 || m.away.team === t1 || m.home.team === t2 || m.away.team === t2
    ) ??
    null
  );
}

/**
 * Map every live knockout fixture onto its canonical bracket position, producing
 * the per-match results (scores/winner) and overrides (real teams + kickoff) to
 * feed `buildProjectedKnockoutBracket`. Rounds are processed in order so each
 * round resolves against the real upstream winners carried by earlier overrides.
 */
function mapLiveMatchesToConfig(
  standings: Record<GroupId, GroupStanding[]>,
  liveMatches: LiveKnockoutMatch[]
): { results: Partial<Record<number, KnockoutResult>>; overrides: Map<number, KnockoutOverride> } {
  const results: Partial<Record<number, KnockoutResult>> = {};
  const overrides = new Map<number, KnockoutOverride>();

  const byRound = new Map<KnockoutRoundKey, LiveKnockoutMatch[]>();
  for (const live of liveMatches) {
    const existing = byRound.get(live.roundKey);
    if (existing) existing.push(live);
    else byRound.set(live.roundKey, [live]);
  }

  for (const roundKey of ROUND_ORDER) {
    const roundLive = byRound.get(roundKey);
    if (!roundLive || roundLive.length === 0) continue;

    // Resolve the bracket so far with the overrides accumulated from earlier
    // rounds, so this round's slots carry the actual winners (not guesses).
    const bracket = buildProjectedKnockoutBracket(standings, results, overrides);
    const round = bracket.rounds.find((candidate) => candidate.key === roundKey);
    if (!round) continue;

    for (const live of roundLive) {
      const t1 = live.t1 || null;
      const t2 = live.t2 || null;
      if (!t1 || !t2) continue; // not yet drawn — leave the projected placeholder

      const target = findTargetMatch(round.matches, t1, t2, roundKey, standings);
      if (!target) continue;

      // Orient to the config's home slot so scores and the displayed teams line
      // up with the bracket structure; the away team override still carries the
      // real opponent (correcting a projected third-place team).
      const homeIsT1 = target.home.team === t2 ? false : true;
      const homeTeam = homeIsT1 ? t1 : t2;
      const awayTeam = homeIsT1 ? t2 : t1;
      const homeScore = homeIsT1 ? live.s1 : live.s2;
      const awayScore = homeIsT1 ? live.s2 : live.s1;
      const homePens = homeIsT1 ? live.p1 : live.p2;
      const awayPens = homeIsT1 ? live.p2 : live.p1;
      const winner: 'home' | 'away' | null =
        live.winner === null
          ? null
          : live.winner === 't1'
            ? homeIsT1
              ? 'home'
              : 'away'
            : homeIsT1
              ? 'away'
              : 'home';

      results[target.match] = {
        homeScore,
        awayScore,
        homePens,
        awayPens,
        winner,
        // Only a finished match is decided. A live one (including extra time and
        // shootouts) keeps its running score on the card but advances no one.
        decided: live.status === 'finished',
        status: live.status,
        detailedStatus: live.detailedStatus,
      };
      overrides.set(target.match, {
        homeTeam,
        awayTeam,
        date: live.date,
        time: live.time,
        utcDate: live.utcDate,
        venue: live.venue,
      });
    }
  }

  return { results, overrides };
}

/**
 * Build the bracket from the live feed. The feed carries the real knockout
 * fixtures (actual teams, dates, times, scores), so we overlay them onto the
 * canonical config bracket: correct tree ordering and the full road to the final
 * (every round, with projected/TBD slots ahead of the live games) while the real
 * teams, kickoffs and scores come from the feed. Falls back to the pure
 * projection before any knockout fixtures exist (pre-tournament or static mode).
 */
export function buildKnockoutBracketFromLive(
  standings: Record<GroupId, GroupStanding[]>,
  liveMatches: LiveKnockoutMatch[]
): ProjectedKnockoutBracket {
  if (liveMatches.length === 0) {
    return buildProjectedKnockoutBracket(standings);
  }

  const { results, overrides } = mapLiveMatchesToConfig(standings, liveMatches);
  return buildProjectedKnockoutBracket(standings, results, overrides);
}

export function buildKnockoutResultsFromLiveMatches(
  standings: Record<GroupId, GroupStanding[]>,
  liveMatches: LiveKnockoutMatch[]
): Partial<Record<number, KnockoutResult>> {
  return mapLiveMatchesToConfig(standings, liveMatches).results;
}

export function getCompletedKnockoutScoringMatches(
  bracket: ProjectedKnockoutBracket
): ScoringMatch[] {
  return bracket.rounds.flatMap((round) =>
    round.matches.flatMap((match) => {
      if (
        !match.isPlayed ||
        !match.home.team ||
        !match.away.team ||
        match.homeScore === null ||
        match.awayScore === null
      ) {
        return [];
      }

      return [
        {
          t1: match.home.team,
          t2: match.away.team,
          s1: match.homeScore,
          s2: match.awayScore,
          winner: match.winner === 'home' ? 't1' : 't2',
        } satisfies ScoringMatch,
      ];
    })
  );
}
