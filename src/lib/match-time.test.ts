import { describe, expect, it } from 'vitest';

import { getFixtureDisplayParts } from '@/lib/match-time';
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
