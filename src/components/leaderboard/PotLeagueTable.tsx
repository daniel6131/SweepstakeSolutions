import { Flag } from '@/components/ui/Flag';
import type { PotLeagueRow } from '@/lib/ledger-of-fate';
import type { ThemeColors } from '@/types';

type Props = {
  label: string;
  tier: string;
  rows: PotLeagueRow[];
  theme: ThemeColors;
};

/** One pot's mini-leaderboard: all 12 players ranked by just their team in this tier. */
export function PotLeagueTable({ label, tier, rows, theme }: Props) {
  return (
    <div className="surface-card rounded-2xl p-4 md:p-5">
      <div className="mb-3 flex items-baseline justify-between">
        <h4
          className="font-display text-xl leading-none md:text-2xl"
          style={{ color: theme.accent }}>
          {label}
        </h4>
        <span
          className="font-heading text-[10px] font-semibold uppercase tracking-[2px]"
          style={{ color: 'var(--color-fg-subtle)' }}>
          {tier}
        </span>
      </div>

      <ol className="flex flex-col" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {rows.map((row, index) => {
          const isTop = index === 0;
          const isBottom = index === rows.length - 1 && rows.length > 1;
          const rankColor = isTop
            ? 'var(--color-success)'
            : isBottom
              ? 'var(--color-danger)'
              : 'var(--color-fg-subtle)';

          return (
            <li
              key={row.team}
              className="flex items-center gap-2.5 py-1.5"
              style={{ borderTop: index > 0 ? '1px solid var(--color-accent-a8)' : undefined }}>
              <span
                className="font-heading w-4 shrink-0 text-center text-[11px] font-bold tabular-nums"
                style={{ color: rankColor }}>
                {row.rank}
              </span>
              <Flag team={row.team} size={16} />
              <span className="min-w-0 flex-1 truncate text-[12px] font-semibold">{row.name}</span>
              <span
                className="hidden truncate text-[11px] font-medium sm:inline"
                style={{ color: 'var(--color-fg-subtle)' }}>
                {row.team}
              </span>
              <span
                className="font-display w-7 shrink-0 text-right text-lg leading-none"
                style={{ color: isTop ? theme.accent : 'var(--color-fg)' }}>
                {row.pts}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
