import type { ScoringMatch } from '@/lib/scoring';
import type { GroupId, GroupStanding, KnockoutRoundKey, LiveKnockoutMatch } from '@/types';

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
  score: number | null;
  isWinner: boolean;
};

export type KnockoutMatch = {
  match: number;
  roundKey: KnockoutRoundKey;
  date: string;
  venue: string;
  home: KnockoutSlot;
  away: KnockoutSlot;
  homeScore: number | null;
  awayScore: number | null;
  winner: 'home' | 'away' | null;
  isPlayed: boolean;
  isReady: boolean;
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
    isWinner: false,
  };
}

export function buildProjectedKnockoutBracket(
  standings: Record<GroupId, GroupStanding[]>,
  results: Partial<Record<number, KnockoutResult>> = {}
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
    const matches = MATCHES.filter((match) => match.roundKey === roundKey).map((match) => {
      const home = resolveSlot(
        match.home,
        standings,
        thirdPlaceStandings,
        thirdPlaceAssignments,
        match.match,
        resolvedMatches
      );
      const away = resolveSlot(
        match.away,
        standings,
        thirdPlaceStandings,
        thirdPlaceAssignments,
        match.match,
        resolvedMatches
      );
      const result = results[match.match];
      const homeScore = result?.homeScore ?? null;
      const awayScore = result?.awayScore ?? null;
      const isReady = Boolean(home.team && away.team);
      const winner =
        isReady && homeScore !== null && awayScore !== null
          ? homeScore > awayScore
            ? 'home'
            : awayScore > homeScore
              ? 'away'
              : (result?.winner ?? null)
          : null;

      const builtMatch: KnockoutMatch = {
        match: match.match,
        roundKey,
        date: match.date,
        venue: match.venue,
        home: {
          ...home,
          score: homeScore,
          isWinner: winner === 'home',
        },
        away: {
          ...away,
          score: awayScore,
          isWinner: winner === 'away',
        },
        homeScore,
        awayScore,
        winner,
        isPlayed: winner !== null,
        isReady,
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

export function buildKnockoutResultsFromLiveMatches(
  standings: Record<GroupId, GroupStanding[]>,
  liveMatches: LiveKnockoutMatch[]
): Partial<Record<number, KnockoutResult>> {
  const results: Partial<Record<number, KnockoutResult>> = {};
  const matchesByRound = new Map<KnockoutRoundKey, LiveKnockoutMatch[]>();

  for (const liveMatch of liveMatches) {
    const roundMatches = matchesByRound.get(liveMatch.roundKey);
    if (roundMatches) {
      roundMatches.push(liveMatch);
      continue;
    }

    matchesByRound.set(liveMatch.roundKey, [liveMatch]);
  }

  for (const roundKey of ROUND_ORDER) {
    const roundMatches = matchesByRound.get(roundKey);
    if (!roundMatches || roundMatches.length === 0) continue;

    const bracket = buildProjectedKnockoutBracket(standings, results);
    const round = bracket.rounds.find((candidate) => candidate.key === roundKey);
    if (!round) continue;

    for (const liveMatch of roundMatches) {
      let targetMatch = round.matches.find(
        (match) => match.home.team === liveMatch.t1 && match.away.team === liveMatch.t2
      );
      let reversed = false;

      if (!targetMatch) {
        targetMatch = round.matches.find(
          (match) => match.home.team === liveMatch.t2 && match.away.team === liveMatch.t1
        );
        reversed = Boolean(targetMatch);
      }

      if (!targetMatch) continue;

      const homeScore = reversed ? liveMatch.s2 : liveMatch.s1;
      const awayScore = reversed ? liveMatch.s1 : liveMatch.s2;
      const winner =
        liveMatch.winner === null
          ? null
          : reversed
            ? liveMatch.winner === 't1'
              ? 'away'
              : 'home'
            : liveMatch.winner === 't1'
              ? 'home'
              : 'away';

      results[targetMatch.match] = {
        homeScore,
        awayScore,
        winner,
      };
    }
  }

  return results;
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
