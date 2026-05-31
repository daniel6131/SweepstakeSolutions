import { Flag } from '@/components/ui/Flag';
import type { ThirdPlaceSummary } from '@/lib/knockout';
import type { ThemeColors } from '@/types';
import { Fragment } from 'react';

type Props = {
  rows: ThirdPlaceSummary[];
  ownerByTeam: Map<string, string>;
  completedGroups: number;
  totalGroups: number;
  theme: ThemeColors;
};

const QUALIFY_COUNT = 8;
const COLS = '34px minmax(0,1fr) 52px 44px 48px';

export function BestThirdPlaceTable({
  rows,
  ownerByTeam,
  completedGroups,
  totalGroups,
  theme,
}: Props) {
  return (
    <section
      className="surface-card overflow-hidden rounded-[24px] md:rounded-[28px]"
      style={{ fontVariantNumeric: 'tabular-nums' }}
      data-reveal>
      {/* Header */}
      <div
        className="flex flex-col gap-5 px-4 py-5 md:flex-row md:items-end md:justify-between md:px-6"
        style={{
          background: `radial-gradient(120% 140% at 100% 0%, ${theme.accent}16 0%, transparent 50%)`,
          borderBottom: '1px solid var(--card-border)',
        }}>
        <div>
          <div
            className="font-heading mb-2 text-[10px] font-bold tracking-[3px] uppercase"
            style={{ color: `${theme.accent}70` }}>
            Live Race
          </div>
          <h3
            className="font-display text-[28px] leading-none tracking-[-0.03em] md:text-[38px]"
            style={{ color: 'var(--color-fg)' }}>
            Best 3rd-place race
          </h3>
        </div>
        <div className="flex items-center gap-7 md:gap-9">
          <div>
            <div
              className="font-display text-[30px] leading-none tabular-nums md:text-[38px]"
              style={{ color: theme.accent }}>
              8
            </div>
            <div
              className="font-heading mt-1.5 text-[9px] font-bold tracking-[2px] uppercase"
              style={{ color: `${theme.accent}55` }}>
              Advance
            </div>
          </div>
          <div className="h-9 w-px" style={{ background: `${theme.accent}22` }} />
          <div>
            <div
              className="font-display text-[30px] leading-none tabular-nums md:text-[38px]"
              style={{ color: theme.accent }}>
              {completedGroups}
              <span style={{ color: `${theme.accent}40` }}>/{totalGroups}</span>
            </div>
            <div
              className="font-heading mt-1.5 text-[9px] font-bold tracking-[2px] uppercase"
              style={{ color: `${theme.accent}55` }}>
              Groups in
            </div>
          </div>
        </div>
      </div>

      {/* Column header */}
      <div
        className="font-heading grid items-center gap-2 px-4 py-2.5 text-[8px] font-bold tracking-[1.5px] uppercase md:px-6"
        style={{ gridTemplateColumns: COLS, color: `${theme.accent}40` }}>
        <span>#</span>
        <span>Team</span>
        <span className="text-center">Grp</span>
        <span className="text-center">GD</span>
        <span className="text-right">Pts</span>
      </div>

      {/* Rows + qualification cutoff */}
      {rows.map((row, i) => {
        const rank = i + 1;
        const qualified = i < QUALIFY_COUNT;
        const showCutoff = i === QUALIFY_COUNT - 1 && rows.length > QUALIFY_COUNT;
        return (
          <Fragment key={row.group}>
            <div
              className="row-hover grid items-center gap-2 px-4 py-3 md:px-6"
              style={{
                gridTemplateColumns: COLS,
                boxShadow: qualified ? 'inset 3px 0 0 0 var(--color-accent)' : undefined,
                background: qualified ? 'var(--color-accent-a4)' : undefined,
                borderTop: i > 0 ? '1px solid var(--color-accent-a8)' : undefined,
              }}>
              <span
                className="font-display text-[17px]"
                style={{ color: qualified ? theme.accent : 'var(--color-fg-subtle)' }}>
                {rank}
              </span>
              <div className="flex min-w-0 items-center gap-2.5">
                <Flag team={row.team} size={22} />
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-semibold">{row.team}</div>
                  <div className="truncate text-[9px]" style={{ color: `${theme.accent}48` }}>
                    {ownerByTeam.get(row.team) ?? 'Unassigned'}
                  </div>
                </div>
              </div>
              <span className="text-center">
                <span
                  className="font-heading rounded px-1.5 py-0.5 text-[9px] font-bold uppercase"
                  style={{ background: `${theme.accent}14`, color: theme.accent }}>
                  {row.group}
                </span>
              </span>
              <span
                className="text-center text-[12px] font-semibold"
                style={{
                  color:
                    row.gd > 0
                      ? 'var(--color-success)'
                      : row.gd < 0
                        ? 'var(--color-danger)'
                        : 'var(--color-fg-subtle)',
                }}>
                {row.gd > 0 ? `+${row.gd}` : row.gd}
              </span>
              <span
                className="font-display text-right text-[20px]"
                style={{ color: row.pts > 0 ? theme.accent : 'var(--color-fg-subtle)' }}>
                {row.pts}
              </span>
            </div>
            {showCutoff ? (
              <div
                className="font-heading flex items-center gap-3 px-4 py-2 text-[8px] font-bold tracking-[2px] uppercase md:px-6"
                style={{ background: `${theme.accent}0a`, color: `${theme.accent}70` }}>
                <span className="h-px flex-1" style={{ background: `${theme.accent}2a` }} />
                <span className="shrink-0">Qualification cutoff · top 8 advance</span>
                <span className="h-px flex-1" style={{ background: `${theme.accent}2a` }} />
              </div>
            ) : null}
          </Fragment>
        );
      })}
    </section>
  );
}
