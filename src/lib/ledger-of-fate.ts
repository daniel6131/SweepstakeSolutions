/**
 * The Ledger of Fate: the only metric a fate-assigned sweepstake can compute.
 *
 * The draft deals every player one team from each pot (round → pot is fixed in
 * `draftPots.ts`), so on paper everyone holds an identical hand. The drama is
 * therefore NOT in the pot mix but in *which specific team you drew within each
 * tier*: of the 12 people each handed a Pot-1 side, who got Brazil and who got
 * the host nobody fancied?
 *
 * This module grades each owned team against its pot peers:
 *   - `potAvg` is the "par" for that tier: mean points of all 12 teams in the pot
 *   - `delta` is how far the team is over/under par
 *   - `potRank` is where it sits among the 12 (1 = best)
 *   - `verdict` is GIFTED (top third) · PAR · ROBBED (bottom third)
 *
 * Points reuse the exact leaderboard scoring (`buildTeamRecords`), so a team's
 * "actual" here equals its contribution to the real table. Trades can unbalance
 * a hand; the maths handles arbitrary pot composition and flags when the
 * luck-adjusted order genuinely diverges from the raw leaderboard.
 */

import { getPotForTeam, getTeamsForPot } from '@/data/draftPots';
import { buildTeamRecords } from '@/lib/scoring';
import type { DraftPot } from '@/data/draftPots';
import type { ScoringMatch } from '@/lib/scoring';
import type { Participant } from '@/types';

const POTS: DraftPot[] = [1, 2, 3, 4];

export type PotVerdict = 'GIFTED' | 'PAR' | 'ROBBED';

export type LedgerTeam = {
  team: string;
  pot: DraftPot;
  /** Actual points, identical to this team's contribution to the leaderboard. */
  pts: number;
  /** Expected ("par") points = mean points of all teams in this pot. */
  potAvg: number;
  /** pts − potAvg. */
  delta: number;
  /** 1-based rank within the pot (1 = strongest of the tier). */
  potRank: number;
  potSize: number;
  verdict: PotVerdict;
};

export type LedgerEntry = {
  name: string;
  /** Owned teams, ordered Pot 1 → Pot 4. */
  teams: LedgerTeam[];
  /** Sum of team points, equals the player's leaderboard total. */
  actualPts: number;
  /** Sum of per-team par, i.e. what an average hand would have scored. */
  parPts: number;
  /** actualPts − parPts: how far over/under an average hand the player sits. */
  fateDelta: number;
};

export type PotLeagueRow = {
  name: string;
  team: string;
  pts: number;
  rank: number;
};

export type LedgerOfFate = {
  /** Players ordered by raw points (familiar), tiebroken by fate delta then name. */
  entries: LedgerEntry[];
  /** Four parallel mini-leaderboards, one per pot. */
  leagues: Record<DraftPot, PotLeagueRow[]>;
  potAverages: Record<DraftPot, number>;
  /** True only when uneven hands make the luck-adjusted order differ from points. */
  divergesFromLeaderboard: boolean;
};

function verdictForRank(rank: number, size: number): PotVerdict {
  const third = Math.ceil(size / 3);
  if (rank <= third) return 'GIFTED';
  if (rank > size - third) return 'ROBBED';
  return 'PAR';
}

/**
 * Grade every player's hand against the pots it was dealt from.
 *
 * @param matches: the same scoring matches that feed `computeLeaderboard`.
 */
export function computeLedgerOfFate(
  matches: ScoringMatch[],
  participants: Participant[]
): LedgerOfFate {
  const records = buildTeamRecords(matches);
  const ptsOf = (team: string): number => records.get(team)?.pts ?? 0;

  const potAverages = {} as Record<DraftPot, number>;
  const potHasData = {} as Record<DraftPot, boolean>;
  // Each pot's 12 teams ranked strong → weak (mirrors the leaderboard tiebreak).
  const potRankings = {} as Record<DraftPot, string[]>;

  for (const pot of POTS) {
    const teams = getTeamsForPot(pot);
    const total = teams.reduce((sum, team) => sum + ptsOf(team), 0);
    potAverages[pot] = teams.length > 0 ? total / teams.length : 0;
    potHasData[pot] = total > 0;
    potRankings[pot] = [...teams].sort((a, b) => {
      const ra = records.get(a);
      const rb = records.get(b);
      return (
        (rb?.pts ?? 0) - (ra?.pts ?? 0) ||
        (rb?.gd ?? 0) - (ra?.gd ?? 0) ||
        (rb?.gf ?? 0) - (ra?.gf ?? 0) ||
        a.localeCompare(b)
      );
    });
  }

  const entries: LedgerEntry[] = participants.map((participant) => {
    const teams: LedgerTeam[] = participant.teams.map((team) => {
      const pot = getPotForTeam(team) ?? 4;
      const potSize = getTeamsForPot(pot).length;
      const indexInPot = potRankings[pot].indexOf(team);
      const potRank = indexInPot >= 0 ? indexInPot + 1 : potSize;
      const pts = ptsOf(team);
      const potAvg = potAverages[pot];

      return {
        team,
        pot,
        pts,
        potAvg,
        delta: pts - potAvg,
        potRank,
        potSize,
        // Before a pot has any results, every draw is still neutral; never stamp
        // ROBBED/GIFTED off an alphabetical tiebreak.
        verdict: potHasData[pot] ? verdictForRank(potRank, potSize) : 'PAR',
      };
    });

    teams.sort((a, b) => a.pot - b.pot);
    const actualPts = teams.reduce((sum, t) => sum + t.pts, 0);
    const parPts = teams.reduce((sum, t) => sum + t.potAvg, 0);

    return { name: participant.name, teams, actualPts, parPts, fateDelta: actualPts - parPts };
  });

  entries.sort(
    (a, b) => b.actualPts - a.actualPts || b.fateDelta - a.fateDelta || a.name.localeCompare(b.name)
  );

  const ownerByTeam = new Map<string, string>();
  for (const participant of participants) {
    for (const team of participant.teams) ownerByTeam.set(team, participant.name);
  }

  // Each league = the pot's 12 teams ranked, tagged with their owner. Reusing
  // potRankings means a team's league rank always equals its potRank on the hand,
  // and the table is gap-free even if trades leave a player with two in a tier.
  const leagues = {} as Record<DraftPot, PotLeagueRow[]>;
  for (const pot of POTS) {
    leagues[pot] = potRankings[pot].map((team, index) => ({
      name: ownerByTeam.get(team) ?? '—',
      team,
      pts: ptsOf(team),
      rank: index + 1,
    }));
  }

  const byPoints = entries.map((entry) => entry.name);
  const byFate = [...entries]
    .sort((a, b) => b.fateDelta - a.fateDelta || a.name.localeCompare(b.name))
    .map((entry) => entry.name);
  const divergesFromLeaderboard = byPoints.some((name, index) => name !== byFate[index]);

  return { entries, leagues, potAverages, divergesFromLeaderboard };
}
