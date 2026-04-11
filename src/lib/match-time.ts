import type { Fixture } from '@/types';

type FixtureDisplayParts = {
  dayKey: string;
  dateLabel: string;
  timeLabel: string;
  timeWithZoneLabel: string;
  timeZoneLabel: string | null;
};

function getFixtureDate(fixture: Fixture): Date | null {
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
  fixture: Fixture,
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
