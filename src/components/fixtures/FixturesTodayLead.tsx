import { FixtureCard } from '@/components/fixtures/FixtureCard';
import type { Fixture, ThemeColors } from '@/types';

type Props = {
  fixtures: Fixture[];
  dateLabel: string;
  /** 'Live now' | 'Today' | 'Up next' */
  overline: string;
  /** Any match in this block is in play (drives the pulsing dot). */
  live: boolean;
  ownerByTeam: Map<string, string>;
  theme: ThemeColors;
  timeZone: string | null;
  nowMs: number | null;
};

/**
 * The lead block at the top of the Fixtures feed: surfaces the current day's
 * matches on arrival so you see them WITHOUT navigating, while the full
 * chronological schedule stays below for browsing. Only rendered when that day
 * isn't already the first in the list (no point duplicating the very top).
 */
export function FixturesTodayLead({
  fixtures,
  dateLabel,
  overline,
  live,
  ownerByTeam,
  theme,
  timeZone,
  nowMs,
}: Props) {
  if (fixtures.length === 0) return null;

  return (
    <section className="mb-8 md:mb-10" aria-label={`${overline}, ${dateLabel}`} data-reveal>
      <div
        className="mb-4 flex items-end justify-between gap-4 border-b pb-4 md:mb-5"
        style={{ borderColor: `${theme.accent}1a` }}>
        <div>
          <div
            className="font-heading mb-2 flex items-center gap-2 text-[10px] font-bold tracking-[3px] uppercase md:text-[11px]"
            style={{ color: theme.accent }}>
            {live && (
              <span className="relative flex h-1.5 w-1.5 items-center justify-center">
                <span
                  className="absolute inline-flex h-1.5 w-1.5 rounded-full"
                  style={{
                    background: theme.accent,
                    animation: 'live-ping 1.8s var(--ease-standard) infinite',
                  }}
                />
                <span
                  className="relative inline-flex h-1.5 w-1.5 rounded-full"
                  style={{
                    background: theme.accent,
                    animation: 'live-dot 1.8s ease-in-out infinite',
                  }}
                />
              </span>
            )}
            {overline}
          </div>
          <h3
            className="font-display text-[28px] leading-none tracking-[-0.03em] md:text-[40px]"
            style={{ color: theme.accent }}>
            {dateLabel}
          </h3>
        </div>
        <div
          className="font-heading rounded-full px-3 py-1.5 text-[10px] font-bold tracking-[2px] uppercase"
          style={{ color: theme.bg, background: theme.accent }}>
          {fixtures.length} {fixtures.length === 1 ? 'match' : 'matches'}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(320px,1fr))] md:gap-4">
        {fixtures.map((fixture) => (
          <FixtureCard
            key={`${fixture.utcDate ?? fixture.date}-${fixture.t1}-${fixture.t2}`}
            fixture={fixture}
            ownerByTeam={ownerByTeam}
            theme={theme}
            timeZone={timeZone}
            nowMs={nowMs}
          />
        ))}
      </div>
    </section>
  );
}
