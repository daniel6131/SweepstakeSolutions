/**
 * Provisional Hell: the live "IF IT ENDED NOW" overlay.
 *
 * The displayed leaderboard already folds in-play scores into every total (a
 * live match arrives with its running score in `s1/s2`), so the table you see
 * during a match is ALREADY the if-it-ended-now table. What was missing is the
 * thing that makes that dramatic instead of silent: a *settled* baseline (only
 * finished matches) to diff against, so we can show who is climbing, who is
 * being overtaken live, and which of a player's four nations is on the pitch
 * right now deciding it.
 *
 * This module is pure derived compute. It reuses the exact leaderboard ordering
 * (`computeLeaderboard`) for both the live and settled tables (the caller passes
 * both), and never touches the network. It rides the canonical snapshot like
 * everything else, so it refreshes on the same cadence as the live data.
 *
 * Note: every one of the 48 nations is owned (12 players x 4), and the draft
 * forbids a player holding two teams from the same group, so each live group
 * match is always between two DIFFERENT owners. There is real money on every
 * goal.
 */

import type {
  DetailedMatchStatus,
  Fixture,
  GroupId,
  LeaderboardEntry,
  LiveKnockoutMatch,
  MatchStatus,
  Participant,
} from '@/types';

/** One of a player's teams that is on the pitch right now, from its own POV. */
export type LiveTeamSwing = {
  team: string;
  opponent: string;
  /** Group letter for a group-stage match; absent for a knockout fixture. */
  group?: GroupId;
  /** On-pitch goals for / against this owned team (shootout kicks excluded). */
  gf: number;
  ga: number;
  /** This team's live result. Forced to a neutral 'drawing' during a shootout:
   *  the match is level on the pitch, so no team is winning or losing. */
  state: 'winning' | 'drawing' | 'losing';
  /** Kickoff + phase signals so the client can show an approximate live minute.
   *  Absent on static data; the clock then falls back to a bare "LIVE". */
  kickoffUtc?: string;
  detailedStatus?: DetailedMatchStatus;
  halfTimeRecorded?: boolean;
  /** Knockout extras: the round label, and the penalty-shootout tally (this team
   *  vs opponent) shown as an indicator without ever moving the scoreline. */
  roundLabel?: string;
  isKnockout?: boolean;
  isShootout?: boolean;
  pens?: number | null;
  oppPens?: number | null;
};

const KNOCKOUT_ROUND_LABEL: Record<LiveKnockoutMatch['roundKey'], string> = {
  roundOf32: 'R32',
  roundOf16: 'R16',
  quarterFinals: 'QF',
  semiFinals: 'SF',
  final: 'Final',
};

/** A live match surfaced for the banner ticker (owners attached for the story). */
export type LiveMatch = {
  group: GroupId;
  t1: string;
  t2: string;
  s1: number;
  s2: number;
  owner1: string | null;
  owner2: string | null;
};

export type ProvisionalEntry = {
  name: string;
  /** 1-based place counting only finished matches (the table before kickoff). */
  settledRank: number;
  /** 1-based place if every live match ended now (matches the displayed table). */
  liveRank: number;
  /** settledRank - liveRank. Positive = climbing, negative = being overtaken. */
  rankDelta: number;
  settledPts: number;
  livePts: number;
  /** livePts - settledPts. Always >= 0 (a live match can only add points). */
  ptsDelta: number;
  /** This player's teams currently in play (empty when none are). */
  liveTeams: LiveTeamSwing[];
};

export type Provisional = {
  /** True when at least one owned team is on the pitch (the whole overlay gates on this). */
  active: boolean;
  /** Live matches (group or knockout) involving an owned team. */
  liveOwnedMatchCount: number;
  /** True when the provisional order genuinely differs from the settled order. */
  reordered: boolean;
  /** Per player, in the SAME order as the live leaderboard (so the UI can zip them by index). */
  entries: ProvisionalEntry[];
  /** Live matches for the banner ticker. */
  liveMatches: LiveMatch[];
};

function swingState(gf: number, ga: number): LiveTeamSwing['state'] {
  if (gf > ga) return 'winning';
  if (gf < ga) return 'losing';
  return 'drawing';
}

/** A fixture counts as live only when it has a running score we can fold in. */
export function isLiveFixture(
  fixture: Fixture
): fixture is Fixture & { status: MatchStatus; s1: number; s2: number } {
  return fixture.status === 'live' && fixture.s1 !== null && fixture.s2 !== null;
}

/**
 * Diff the live-inclusive leaderboard against a finished-only baseline.
 *
 * @param liveLeaderboard    the displayed table (folds in current live scores)
 * @param settledLeaderboard the same computation over finished matches only
 * @param liveFixtures       fixtures currently in play (already filtered to live)
 * @param participants       roster, to map each live team back to its owner
 */
export function computeProvisional(
  liveLeaderboard: LeaderboardEntry[],
  settledLeaderboard: LeaderboardEntry[],
  liveFixtures: Fixture[],
  participants: Participant[],
  liveKnockoutMatches: LiveKnockoutMatch[] = []
): Provisional {
  const ownerByTeam = new Map<string, string>();
  for (const participant of participants) {
    for (const team of participant.teams) ownerByTeam.set(team, participant.name);
  }

  const settledRankByName = new Map<string, number>();
  const settledPtsByName = new Map<string, number>();
  settledLeaderboard.forEach((entry, index) => {
    settledRankByName.set(entry.name, index + 1);
    settledPtsByName.set(entry.name, entry.pts);
  });

  // Collect the live teams owned by each player + the matches for the ticker.
  const liveTeamsByOwner = new Map<string, LiveTeamSwing[]>();
  const liveMatches: LiveMatch[] = [];
  let liveOwnedMatchCount = 0;

  for (const fixture of liveFixtures) {
    if (!isLiveFixture(fixture)) continue;

    const owner1 = ownerByTeam.get(fixture.t1) ?? null;
    const owner2 = ownerByTeam.get(fixture.t2) ?? null;
    if (owner1 || owner2) liveOwnedMatchCount += 1;

    liveMatches.push({
      group: fixture.group,
      t1: fixture.t1,
      t2: fixture.t2,
      s1: fixture.s1,
      s2: fixture.s2,
      owner1,
      owner2,
    });

    const push = (owner: string | null, team: string, opponent: string, gf: number, ga: number) => {
      if (!owner) return;
      const swing: LiveTeamSwing = {
        team,
        opponent,
        group: fixture.group,
        gf,
        ga,
        state: swingState(gf, ga),
        kickoffUtc: fixture.utcDate,
        detailedStatus: fixture.detailedStatus,
        halfTimeRecorded: fixture.halfTimeRecorded,
      };
      const list = liveTeamsByOwner.get(owner);
      if (list) list.push(swing);
      else liveTeamsByOwner.set(owner, [swing]);
    };

    push(owner1, fixture.t1, fixture.t2, fixture.s1, fixture.s2);
    push(owner2, fixture.t2, fixture.t1, fixture.s2, fixture.s1);
  }

  // Live knockout matches surface on the leaderboard too, but only as live-score
  // indicators: their points are banked at full time (via the bracket scoring),
  // not provisionally. A shootout shows the on-pitch score (level) plus the kicks
  // and is forced neutral, so the board never flags a "winner" on penalties.
  for (const km of liveKnockoutMatches) {
    if (km.status !== 'live' || km.s1 === null || km.s2 === null) continue;

    const owner1 = ownerByTeam.get(km.t1) ?? null;
    const owner2 = ownerByTeam.get(km.t2) ?? null;
    if (owner1 || owner2) liveOwnedMatchCount += 1;

    const isShootout = km.detailedStatus === 'PENALTY_SHOOTOUT';
    const roundLabel = KNOCKOUT_ROUND_LABEL[km.roundKey];

    const pushKnockout = (
      owner: string | null,
      team: string,
      opponent: string,
      gf: number,
      ga: number,
      pens: number | null,
      oppPens: number | null
    ) => {
      if (!owner) return;
      const swing: LiveTeamSwing = {
        team,
        opponent,
        gf,
        ga,
        state: isShootout ? 'drawing' : swingState(gf, ga),
        kickoffUtc: km.utcDate,
        detailedStatus: km.detailedStatus,
        roundLabel,
        isKnockout: true,
        isShootout,
        pens,
        oppPens,
      };
      const list = liveTeamsByOwner.get(owner);
      if (list) list.push(swing);
      else liveTeamsByOwner.set(owner, [swing]);
    };

    pushKnockout(owner1, km.t1, km.t2, km.s1, km.s2, km.p1, km.p2);
    pushKnockout(owner2, km.t2, km.t1, km.s2, km.s1, km.p2, km.p1);
  }

  // Walk the live leaderboard so liveRank == the order actually rendered.
  const entries: ProvisionalEntry[] = liveLeaderboard.map((entry, index) => {
    const liveRank = index + 1;
    const settledRank = settledRankByName.get(entry.name) ?? liveRank;
    const settledPts = settledPtsByName.get(entry.name) ?? entry.pts;

    return {
      name: entry.name,
      settledRank,
      liveRank,
      rankDelta: settledRank - liveRank,
      settledPts,
      livePts: entry.pts,
      ptsDelta: entry.pts - settledPts,
      liveTeams: liveTeamsByOwner.get(entry.name) ?? [],
    };
  });

  const reordered = entries.some((entry) => entry.rankDelta !== 0);

  return {
    active: liveOwnedMatchCount > 0,
    liveOwnedMatchCount,
    reordered,
    entries,
    liveMatches,
  };
}
