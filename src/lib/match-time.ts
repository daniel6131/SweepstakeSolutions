import type { Fixture } from '@/types';

export type LivePhase = {
  /** Short display string: `~67'`, `~45+'`, `HT`, `ET`, `PENS`, `LIVE`, or `FT`. Empty when not started. */
  label: string;
  /** True only while the match is in play (drives the pulsing badge). */
  live: boolean;
};

/** The minimal shape the live clock needs — a full Fixture or a live-team swing both satisfy it. */
type LiveClockSource = Pick<Fixture, 'status' | 'detailedStatus' | 'utcDate' | 'halfTimeRecorded'>;

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

/**
 * Approximate live match clock, computed client-side. football-data.org's free
 * tier does NOT expose a minute, so this is DERIVED from kickoff time plus the
 * coarse phase signals the API does give (PAUSED = half-time, and whether the
 * half-time score is recorded yet). Derived minutes are prefixed `~` so they
 * never claim broadcast-grade precision; stoppage collapses to `45+`/`90+`.
 *
 * Authoritative phase labels (`HT`, `ET`, `PENS`, `FT`) carry no `~`.
 */
export function getLivePhase(fixture: LiveClockSource, nowMs: number): LivePhase {
  if (fixture.status !== 'live') {
    return { label: fixture.status === 'finished' ? 'FT' : '', live: false };
  }

  // Authoritative phases from the raw API status — no guessing needed.
  switch (fixture.detailedStatus) {
    case 'PAUSED':
      return { label: 'HT', live: true };
    case 'PENALTY_SHOOTOUT':
      return { label: 'PENS', live: true };
    case 'EXTRA_TIME':
      return { label: 'ET', live: true };
    case 'SUSPENDED':
      return { label: 'LIVE', live: true };
    default:
      break;
  }

  // IN_PLAY: derive an approximate minute from elapsed wall-clock since kickoff.
  const kickoff = fixture.utcDate ? Date.parse(fixture.utcDate) : NaN;
  const elapsedMin = Math.floor((nowMs - kickoff) / 60_000);

  // A missing/wrong device clock (or no kickoff) makes elapsed meaningless.
  if (Number.isNaN(elapsedMin) || elapsedMin < 0 || elapsedMin > 180) {
    return { label: 'LIVE', live: true };
  }

  // First half: until half-time is recorded (and before it would be absurd).
  if (!fixture.halfTimeRecorded && elapsedMin <= 47) {
    const minute = clamp(elapsedMin, 1, 45);
    return { label: minute >= 45 ? "~45+'" : `~${minute}'`, live: true };
  }

  // Second half: subtract the ~15 min half-time break from elapsed.
  const secondHalfMin = clamp(elapsedMin - 15, 46, 90);
  return { label: secondHalfMin >= 90 ? "~90+'" : `~${secondHalfMin}'`, live: true };
}

type FixtureDisplayParts = {
  dayKey: string;
  dateLabel: string;
  timeLabel: string;
  timeWithZoneLabel: string;
  timeZoneLabel: string | null;
};

function getFixtureDate(fixture: Pick<Fixture, 'utcDate'>): Date | null {
  if (!fixture.utcDate) return null;

  const timestamp = Date.parse(fixture.utcDate);
  if (Number.isNaN(timestamp)) return null;

  return new Date(timestamp);
}

function getFormatter(timeZone: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat('en-GB', {
    ...options,
    timeZone,
  });
}

export function getFixtureSortTimestamp(fixture: Fixture): number {
  const utcDate = getFixtureDate(fixture);
  if (utcDate) return utcDate.getTime();

  const [month, day] = fixture.date.split(' ');
  const [hours, minutes] = fixture.time.split(':').map(Number);
  const monthIndex =
    {
      Jan: 0,
      Feb: 1,
      Mar: 2,
      Apr: 3,
      May: 4,
      Jun: 5,
      Jul: 6,
      Aug: 7,
      Sep: 8,
      Oct: 9,
      Nov: 10,
      Dec: 11,
    }[month] ?? 0;

  return new Date(2026, monthIndex, Number(day), hours, minutes).getTime();
}

export function getFixtureDisplayParts(
  fixture: Pick<Fixture, 'utcDate' | 'date' | 'time'>,
  timeZone: string | null
): FixtureDisplayParts {
  const utcDate = getFixtureDate(fixture);
  if (!utcDate || !timeZone) {
    return {
      dayKey: fixture.date,
      dateLabel: fixture.date,
      timeLabel: fixture.time,
      timeWithZoneLabel: fixture.time,
      timeZoneLabel: null,
    };
  }

  const dayKey = getFormatter(timeZone, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .formatToParts(utcDate)
    .filter((part) => part.type !== 'literal')
    .map((part) => part.value)
    .join('-');

  const dateLabel = getFormatter(timeZone, {
    month: 'short',
    day: 'numeric',
  }).format(utcDate);

  const timeParts = getFormatter(timeZone, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZoneName: 'short',
  }).formatToParts(utcDate);

  const hour = timeParts.find((part) => part.type === 'hour')?.value ?? '';
  const minute = timeParts.find((part) => part.type === 'minute')?.value ?? '';
  const timeZoneLabel = timeParts.find((part) => part.type === 'timeZoneName')?.value ?? null;
  const timeLabel = `${hour}:${minute}`;

  return {
    dayKey,
    dateLabel,
    timeLabel,
    timeWithZoneLabel: timeZoneLabel ? `${timeLabel} ${timeZoneLabel}` : timeLabel,
    timeZoneLabel,
  };
}

/**
 * The day-bucket key for an instant in the viewer's timezone. Matches the
 * `dayKey` that getFixtureDisplayParts produces for a fixture (same formatter),
 * so "today" can be matched against the grouped day buckets.
 */
export function getDayKey(utcMs: number, timeZone: string): string {
  return getFormatter(timeZone, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .formatToParts(new Date(utcMs))
    .filter((part) => part.type !== 'literal')
    .map((part) => part.value)
    .join('-');
}
