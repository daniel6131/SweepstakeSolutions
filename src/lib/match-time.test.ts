import { describe, expect, it } from 'vitest';

import { getFixtureDisplayParts, getLivePhase } from '@/lib/match-time';
import type { Fixture } from '@/types';

const liveFixture: Fixture = {
  group: 'A',
  t1: 'Mexico',
  t2: 'South Africa',
  date: 'Jun 11',
  time: '19:00',
  utcDate: '2026-06-11T19:00:00Z',
  venue: 'Estadio Azteca',
  s1: null,
  s2: null,
};

describe('getFixtureDisplayParts', () => {
  it('formats live fixtures in Australia local time', () => {
    const display = getFixtureDisplayParts(liveFixture, 'Australia/Melbourne');

    expect(display.dateLabel).toBe('12 Jun');
    expect(display.timeLabel).toBe('05:00');
    expect(display.timeWithZoneLabel).toContain('05:00');
  });

  it('formats live fixtures in UK local time', () => {
    const display = getFixtureDisplayParts(liveFixture, 'Europe/London');

    expect(display.dateLabel).toBe('11 Jun');
    expect(display.timeLabel).toBe('20:00');
    expect(display.timeWithZoneLabel).toContain('20:00');
  });

  it('falls back to fixture strings when no timezone-aware source exists', () => {
    const staticFixture: Fixture = {
      group: 'A',
      t1: 'Mexico',
      t2: 'South Africa',
      date: 'Jun 11',
      time: '17:00',
      venue: 'Estadio Azteca',
      s1: null,
      s2: null,
    };

    const display = getFixtureDisplayParts(staticFixture, 'Australia/Melbourne');

    expect(display.dateLabel).toBe('Jun 11');
    expect(display.timeWithZoneLabel).toBe('17:00');
    expect(display.timeZoneLabel).toBeNull();
  });
});

describe('getLivePhase', () => {
  const KICKOFF = '2026-06-11T19:00:00Z';
  const kickMs = Date.parse(KICKOFF);
  const at = (minutes: number) => kickMs + minutes * 60_000;

  const live = (over: Partial<Fixture> = {}): Fixture => ({
    group: 'A',
    t1: 'Mexico',
    t2: 'South Africa',
    date: 'Jun 11',
    time: '19:00',
    utcDate: KICKOFF,
    venue: 'Estadio Azteca',
    s1: 0,
    s2: 0,
    status: 'live',
    detailedStatus: 'IN_PLAY',
    halfTimeRecorded: false,
    ...over,
  });

  it('returns FT for a finished match and nothing for a scheduled one', () => {
    expect(getLivePhase(live({ status: 'finished' }), at(120))).toEqual({
      label: 'FT',
      live: false,
    });
    expect(getLivePhase(live({ status: 'scheduled' }), at(0))).toEqual({ label: '', live: false });
  });

  it('reads authoritative phases straight from the detailed status', () => {
    expect(getLivePhase(live({ detailedStatus: 'PAUSED' }), at(50))).toEqual({
      label: 'HT',
      live: true,
    });
    expect(getLivePhase(live({ detailedStatus: 'EXTRA_TIME' }), at(100))).toEqual({
      label: 'ET',
      live: true,
    });
    expect(getLivePhase(live({ detailedStatus: 'PENALTY_SHOOTOUT' }), at(125))).toEqual({
      label: 'PENS',
      live: true,
    });
    expect(getLivePhase(live({ detailedStatus: 'SUSPENDED' }), at(30))).toEqual({
      label: 'LIVE',
      live: true,
    });
  });

  it('derives an approximate first-half minute, collapsing stoppage to 45+', () => {
    expect(getLivePhase(live(), at(20))).toEqual({ label: "~20'", live: true });
    expect(getLivePhase(live(), at(46))).toEqual({ label: "~45+'", live: true });
  });

  it('derives a second-half minute by removing the half-time break', () => {
    const secondHalf = live({ halfTimeRecorded: true });
    expect(getLivePhase(secondHalf, at(70))).toEqual({ label: "~55'", live: true });
    expect(getLivePhase(secondHalf, at(110))).toEqual({ label: "~90+'", live: true });
  });

  it('falls back to a bare LIVE label when the clock is unusable', () => {
    expect(getLivePhase(live(), at(-5))).toEqual({ label: 'LIVE', live: true });
    expect(getLivePhase(live({ utcDate: undefined }), Date.now())).toEqual({
      label: 'LIVE',
      live: true,
    });
  });
});
