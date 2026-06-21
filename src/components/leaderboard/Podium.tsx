import { MovementChip } from '@/components/leaderboard/ProvisionalBits';
import { Flag } from '@/components/ui/Flag';
import type { ProvisionalEntry } from '@/lib/provisional';
import type { LeaderboardEntry, ThemeColors } from '@/types';

type PodiumProps = {
  top3: LeaderboardEntry[];
  theme: ThemeColors;
  provisionalByName?: Map<string, ProvisionalEntry>;
};

const MEDALS = ['1ST', '2ND', '3RD'];
const MEDAL_VARS = [
  'var(--color-medal-gold)',
  'var(--color-medal-silver)',
  'var(--color-medal-bronze)',
];

export function Podium({ top3, theme, provisionalByName }: PodiumProps) {
  return (
    <>
      {/* Desktop podium — 3 columns, 2nd | 1st | 3rd */}
      <div
        className="mx-auto mb-12 hidden max-w-185 grid-cols-3 items-end gap-3 md:grid"
        data-reveal>
        {top3.map((p, i) => {
          const heights = [250, 200, 175];
          const order = [1, 0, 2];
          const medal = MEDAL_VARS[i] ?? 'var(--color-fg-muted)';
          const rankDelta = provisionalByName?.get(p.name)?.rankDelta ?? 0;
          return (
            <div
              key={p.name}
              style={{
                order: order[i],
                height: heights[i],
                background: 'var(--card-surface)',
                border: i === 0 ? `2px solid ${theme.accent}` : '1px solid var(--card-border)',
                borderRadius: 18,
                padding: '22px 14px 18px',
                boxShadow:
                  i === 0
                    ? 'var(--card-highlight), var(--shadow-card-lg), var(--shadow-accent)'
                    : 'var(--card-highlight), var(--shadow-card)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
              <div
                className="font-display flex items-center justify-center rounded-full"
                style={{
                  width: 38,
                  height: 38,
                  background: `color-mix(in srgb, ${medal} 12%, transparent)`,
                  border: `2px solid color-mix(in srgb, ${medal} 55%, transparent)`,
                  color: medal,
                  fontSize: 13,
                }}>
                {MEDALS[i]}
              </div>
              <div className="text-center">
                <div
                  className="font-display flex items-center justify-center gap-2"
                  style={{
                    fontSize: i === 0 ? 26 : 20,
                    color: i === 0 ? theme.accent : 'var(--color-fg)',
                  }}>
                  {p.name}
                  <MovementChip delta={rankDelta} />
                </div>
                <div
                  className="font-display mt-1 leading-none"
                  style={{
                    fontSize: i === 0 ? 56 : 40,
                    color: i === 0 ? theme.accent : `${theme.accent}44`,
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                  {p.pts}
                </div>
                <div
                  className="overline mt-1.5"
                  style={{ color: `${theme.accent}33`, fontSize: 9, opacity: 1 }}>
                  POINTS
                </div>
              </div>
              <div className="flex gap-1">
                {p.teams.map((t) => (
                  <Flag key={t} team={t} size={18} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile podium — horizontal cards */}
      <div className="mb-8 flex flex-col gap-2.5 md:hidden" data-reveal>
        {top3.map((p, i) => {
          const medal = MEDAL_VARS[i] ?? 'var(--color-fg-muted)';
          const rankDelta = provisionalByName?.get(p.name)?.rankDelta ?? 0;
          return (
            <div
              key={p.name}
              className="flex items-center gap-4 rounded-2xl px-4 py-4"
              style={{
                background: 'var(--card-surface)',
                border: i === 0 ? `2px solid ${theme.accent}` : '1px solid var(--card-border)',
                boxShadow:
                  i === 0
                    ? 'var(--card-highlight), var(--shadow-card), var(--shadow-accent)'
                    : 'var(--card-highlight), var(--shadow-card)',
              }}>
              <div
                className="font-display flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs"
                style={{
                  background: `color-mix(in srgb, ${medal} 12%, transparent)`,
                  border: `2px solid color-mix(in srgb, ${medal} 44%, transparent)`,
                  color: medal,
                }}>
                {MEDALS[i]}
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className="font-display flex items-center gap-2 text-lg"
                  style={{ color: i === 0 ? theme.accent : 'var(--color-fg)' }}>
                  {p.name}
                  <MovementChip delta={rankDelta} />
                </div>
                <div className="mt-0.5 flex gap-1">
                  {p.teams.map((t) => (
                    <Flag key={t} team={t} size={14} />
                  ))}
                </div>
              </div>
              <div
                className="font-display text-right"
                style={{
                  fontSize: 36,
                  color: i === 0 ? theme.accent : `${theme.accent}44`,
                  fontVariantNumeric: 'tabular-nums',
                }}>
                {p.pts}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
