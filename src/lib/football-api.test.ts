import { describe, expect, it } from 'vitest';

import { transformCompetitionMatches } from '@/lib/football-api';

function formatDateParts(utcDate: string) {
  const date = new Date(utcDate);

  return {
    date: date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
    time: date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
  };
}

function buildMatchesPayload(): Parameters<typeof transformCompetitionMatches>[0] {
  return {
    matches: [
      {
        id: 1,
        utcDate: '2026-06-11T17:00:00Z',
        status: 'SCHEDULED',
        matchday: 1,
        stage: 'GROUP_STAGE',
        group: 'GROUP_A',
        homeTeam: { name: 'Mexico' },
        awayTeam: { name: 'South Africa' },
        score: {
          fullTime: { home: null, away: null },
          halfTime: { home: null, away: null },
          winner: null,
        },
        venue: 'Estadio Azteca',
      },
      {
        id: 2,
        utcDate: '2026-06-12T18:00:00Z',
        status: 'FINISHED',
        matchday: 1,
        stage: 'GROUP_STAGE',
        group: 'GROUP_D',
        homeTeam: { name: 'United States' },
        awayTeam: { name: 'Türkiye' },
        score: {
          fullTime: { home: 2, away: 1 },
          halfTime: { home: 1, away: 0 },
          winner: 'HOME_TEAM',
        },
        venue: 'SoFi Stadium',
      },
      {
        id: 3,
        utcDate: '2026-06-29T18:00:00Z',
        status: 'IN_PLAY',
        matchday: 4,
        stage: 'LAST_16',
        group: null,
        homeTeam: { name: 'Netherlands' },
        awayTeam: { name: 'Morocco' },
        score: {
          fullTime: { home: 1, away: 1 },
          halfTime: { home: 0, away: 1 },
          winner: null,
        },
        venue: 'Houston Stadium',
      },
      {
        id: 4,
        utcDate: '2026-07-04T18:00:00Z',
        status: 'FINISHED',
        matchday: 5,
        stage: 'QUARTER_FINALS',
        group: null,
        homeTeam: { name: 'Korea Republic' },
        awayTeam: { name: 'Bosnia-H.' },
        score: {
          fullTime: { home: 5, away: 4 },
          halfTime: { home: 1, away: 1 },
          winner: 'HOME_TEAM',
        },
        venue: 'Boston Stadium',
      },
      {
        id: 5,
        utcDate: '2026-07-18T18:00:00Z',
        status: 'FINISHED',
        matchday: 7,
        stage: 'THIRD_PLACE',
        group: null,
        homeTeam: { name: 'Portugal' },
        awayTeam: { name: 'Colombia' },
        score: {
          fullTime: { home: 2, away: 1 },
          halfTime: { home: 1, away: 0 },
          winner: 'HOME_TEAM',
        },
        venue: 'Miami Stadium',
      },
      {
        id: 6,
        utcDate: '2026-06-13T15:00:00Z',
        status: 'IN_PLAY',
        matchday: 1,
        stage: 'GROUP_STAGE',
        group: 'GROUP_B',
        homeTeam: { name: 'Germany' },
        awayTeam: { name: 'Scotland' },
        score: {
          fullTime: { home: 1, away: 0 },
          halfTime: { home: 1, away: 0 },
          winner: null,
        },
        venue: 'MetLife Stadium',
      },
      {
        // Real shape from the live API: a shootout folds the kicks INTO fullTime
        // (5-6 = regular 1-1 + extra 0-0 + pens 4-5). The on-pitch result is 1-1,
        // Paraguay advance 5-4 on penalties.
        id: 7,
        utcDate: '2026-06-29T20:30:00Z',
        status: 'FINISHED',
        matchday: 4,
        stage: 'LAST_32',
        group: null,
        homeTeam: { name: 'Germany' },
        awayTeam: { name: 'Paraguay' },
        score: {
          winner: 'AWAY_TEAM',
          duration: 'PENALTY_SHOOTOUT',
          fullTime: { home: 5, away: 6 },
          halfTime: { home: 0, away: 1 },
          regularTime: { home: 1, away: 1 },
          extraTime: { home: 0, away: 0 },
          penalties: { home: 4, away: 5 },
        },
        venue: 'Lincoln Financial Field',
      },
    ],
    resultSet: { count: 7, played: 4 },
  };
}

describe('transformCompetitionMatches', () => {
  it('separates group fixtures from knockout matches and normalizes names', () => {
    const data = transformCompetitionMatches(buildMatchesPayload());
    const scheduledGroup = formatDateParts('2026-06-11T17:00:00Z');
    const finishedGroup = formatDateParts('2026-06-12T18:00:00Z');
    const liveGroup = formatDateParts('2026-06-13T15:00:00Z');
    const liveKnockout = formatDateParts('2026-06-29T18:00:00Z');
    const finishedKnockout = formatDateParts('2026-07-04T18:00:00Z');
    const shootoutKnockout = formatDateParts('2026-06-29T20:30:00Z');

    expect(data.fixtures).toEqual([
      {
        group: 'A',
        t1: 'Mexico',
        t2: 'South Africa',
        date: scheduledGroup.date,
        time: scheduledGroup.time,
        utcDate: '2026-06-11T17:00:00Z',
        venue: 'Estadio Azteca',
        status: 'scheduled',
        detailedStatus: 'SCHEDULED',
        halfTimeRecorded: false,
        s1: null,
        s2: null,
      },
      {
        group: 'D',
        t1: 'USA',
        t2: 'Turkey',
        date: finishedGroup.date,
        time: finishedGroup.time,
        utcDate: '2026-06-12T18:00:00Z',
        venue: 'SoFi Stadium',
        status: 'finished',
        detailedStatus: 'FINISHED',
        halfTimeRecorded: true,
        s1: 2,
        s2: 1,
      },
      {
        group: 'B',
        t1: 'Germany',
        t2: 'Scotland',
        date: liveGroup.date,
        time: liveGroup.time,
        utcDate: '2026-06-13T15:00:00Z',
        venue: 'MetLife Stadium',
        status: 'live',
        detailedStatus: 'IN_PLAY',
        halfTimeRecorded: true,
        s1: 1,
        s2: 0,
      },
    ]);

    // The live group match and the live knockout match both count toward the bug.
    expect(data.liveMatchCount).toBe(2);

    expect(data.knockoutMatches).toEqual([
      {
        roundKey: 'roundOf16',
        t1: 'Netherlands',
        t2: 'Morocco',
        date: liveKnockout.date,
        time: liveKnockout.time,
        utcDate: '2026-06-29T18:00:00Z',
        venue: 'Houston Stadium',
        s1: 1,
        s2: 1,
        p1: null,
        p2: null,
        // Level and still in play: nobody is through yet (the extra-time bug).
        winner: null,
        status: 'live',
        detailedStatus: 'IN_PLAY',
      },
      {
        roundKey: 'quarterFinals',
        t1: 'South Korea',
        t2: 'Bosnia and Herzegovina',
        date: finishedKnockout.date,
        time: finishedKnockout.time,
        utcDate: '2026-07-04T18:00:00Z',
        venue: 'Boston Stadium',
        s1: 5,
        s2: 4,
        p1: null,
        p2: null,
        winner: 't1',
        status: 'finished',
        detailedStatus: 'FINISHED',
      },
      {
        roundKey: 'roundOf32',
        t1: 'Germany',
        t2: 'Paraguay',
        date: shootoutKnockout.date,
        time: shootoutKnockout.time,
        utcDate: '2026-06-29T20:30:00Z',
        venue: 'Lincoln Financial Field',
        // On-pitch 1-1 (kicks stripped from fullTime), pens 4-5, Paraguay through.
        s1: 1,
        s2: 1,
        p1: 4,
        p2: 5,
        winner: 't2',
        status: 'finished',
        detailedStatus: 'FINISHED',
      },
    ]);

    expect(data.extraScoringMatches).toEqual([
      {
        t1: 'Portugal',
        t2: 'Colombia',
        s1: 2,
        s2: 1,
        winner: 't1',
      },
    ]);
  });

  it('keeps a live shootout neutral: kicks present, on-pitch level, nobody through', () => {
    // The real Netherlands v Morocco incident: mid-shootout the feed reported
    // status IN_PLAY + duration PENALTY_SHOOTOUT and prematurely named HOME_TEAM
    // the winner with the wrong tally. We must strip the kicks from the on-pitch
    // score, expose the phase as PENALTY_SHOOTOUT (status stays IN_PLAY), and
    // refuse to mark anyone through until the match is FINISHED.
    const data = transformCompetitionMatches({
      matches: [
        {
          id: 99,
          utcDate: '2026-06-30T18:00:00Z',
          status: 'IN_PLAY',
          matchday: 4,
          stage: 'LAST_32',
          group: null,
          homeTeam: { name: 'Netherlands' },
          awayTeam: { name: 'Morocco' },
          score: {
            winner: 'HOME_TEAM',
            duration: 'PENALTY_SHOOTOUT',
            fullTime: { home: 4, away: 3 },
            halfTime: { home: 0, away: 0 },
            regularTime: { home: 1, away: 1 },
            extraTime: { home: 0, away: 0 },
            penalties: { home: 3, away: 2 },
          },
          venue: 'Houston Stadium',
        },
      ],
      resultSet: { count: 1, played: 0 },
    });

    expect(data.knockoutMatches).toHaveLength(1);
    expect(data.knockoutMatches[0]).toMatchObject({
      t1: 'Netherlands',
      t2: 'Morocco',
      s1: 1,
      s2: 1,
      p1: 3,
      p2: 2,
      status: 'live',
      detailedStatus: 'PENALTY_SHOOTOUT',
      // Premature feed winner is ignored while the match is still in play.
      winner: null,
    });
  });
});
