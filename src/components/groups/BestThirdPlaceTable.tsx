import { Flag } from '@/components/ui/Flag';
import { StatTile } from '@/components/ui/StatTile';
import type { ThirdPlaceSummary } from '@/lib/knockout';
import type { ThemeColors } from '@/types';

type Props = {
  rows: ThirdPlaceSummary[];
  ownerByTeam: Map<string, string>;
  completedGroups: number;
  totalGroups: number;
  theme: ThemeColors;
};

export function BestThirdPlaceTable({
  rows,
  ownerByTeam,
  completedGroups,
  totalGroups,
  theme,
}: Props) {
  return (
    <section
      className="overflow-hidden rounded-[24px] md:rounded-[28px]"
      style={{
        background: `linear-gradient(180deg, ${theme.card} 0%, ${theme.card}f0 100%)`,
        border: `1.5px solid ${theme.accent}12`,
      }}
      data-reveal>
      <div
        className="flex flex-col gap-4 px-4 py-4 md:px-5 md:py-5"
        style={{
          background: `linear-gradient(135deg, ${theme.accent}12 0%, ${theme.accent2}08 100%)`,
          borderBottom: `1px solid ${theme.accent}0d`,
        }}>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="overline mb-2" style={{ color: `${theme.accent}70`, opacity: 1 }}>
              LIVE RANKING
            </div>
            <h3
              className="font-display text-[28px] leading-none tracking-[-0.04em] md:text-[34px]"
              style={{ color: theme.accent }}>
              Best 3rd Place Tracker
            </h3>
            <p className="mt-2 max-w-xl text-sm leading-6" style={{ color: `${theme.accent}90` }}>
              The top eight third-placed teams qualify for the Round of 32.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <StatTile label="In qualification spots" value="8" />
            <StatTile label="Groups complete" value={`${completedGroups}/${totalGroups}`} />
            <StatTile label="Status" value={completedGroups === totalGroups ? 'Locked' : 'Live'} />
          </div>
        </div>
      </div>

      <div
        className="font-heading hidden px-4 py-2 text-[9px] font-bold uppercase tracking-[2px] md:grid"
        style={{
          gridTemplateColumns: '44px minmax(0,1fr) 56px 44px 44px 44px 118px',
          borderBottom: `1px solid ${theme.accent}08`,
          color: `${theme.accent}34`,
        }}>
        <span className="flex items-center justify-center">#</span>
        <span className="flex items-center">Team</span>
        <span className="flex items-center justify-center">Grp</span>
        <span className="flex items-center justify-center">Pts</span>
        <span className="flex items-center justify-center">GD</span>
        <span className="flex items-center justify-center">GF</span>
        <span className="flex items-center justify-end text-right">Status</span>
      </div>

      <div className="divide-y" style={{ borderColor: `${theme.accent}08` }}>
        {rows.map((row, index) => {
          const rank = index + 1;
          const qualified = row.qualified;
          const statusLabel = qualified ? 'Qualified line' : 'Outside';
          const statusTone = qualified ? theme.accent : `${theme.accent}66`;

          return (
            <div
              key={row.group}
              className="px-4 py-3 md:px-5 md:py-0"
              style={{
                background: qualified ? `${theme.accent}05` : 'transparent',
              }}>
              <div
                className="hidden min-h-[72px] items-center md:grid"
                style={{
                  gridTemplateColumns: '44px minmax(0,1fr) 56px 44px 44px 44px 118px',
                }}>
                <div className="flex items-center justify-center">
                  <span
                    className="font-display text-[20px]"
                    style={{ color: qualified ? theme.accent : `${theme.accent}82` }}>
                    {rank}
                  </span>
                </div>

                <div className="flex min-w-0 items-center gap-3">
                  <Flag team={row.team} size={22} />
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-semibold">{row.team}</div>
                    <div className="truncate text-[9px]" style={{ color: `${theme.accent}42` }}>
                      {ownerByTeam.get(row.team) ?? 'Unassigned'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <span
                    className="font-heading rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[2px]"
                    style={{
                      background: `${theme.accent}10`,
                      color: theme.accent,
                      border: `1px solid ${theme.accent}15`,
                    }}>
                    {row.group}
                  </span>
                </div>

                {[row.pts, row.gd > 0 ? `+${row.gd}` : row.gd, row.gf].map((value, valueIndex) => (
                  <div key={valueIndex} className="flex items-center justify-center">
                    <span className="text-center text-[13px]" style={{ color: 'var(--color-fg)' }}>
                      {value}
                    </span>
                  </div>
                ))}

                <div className="flex flex-col items-end justify-center text-right">
                  <span
                    className="font-heading rounded-full px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[2px]"
                    style={{
                      background: `${statusTone}12`,
                      color: statusTone,
                      border: `1px solid ${statusTone}24`,
                    }}>
                    {statusLabel}
                  </span>
                  <div className="mt-1 text-[9px]" style={{ color: `${theme.accent}40` }}>
                    {row.status === 'confirmed' ? 'Group complete' : 'Projection'}
                  </div>
                </div>
              </div>

              <div className="space-y-3 md:hidden">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="font-display flex h-9 w-9 items-center justify-center rounded-full text-[18px]"
                      style={{
                        background: qualified ? `${theme.accent}14` : `${theme.accent}0a`,
                        color: qualified ? theme.accent : `${theme.accent}82`,
                      }}>
                      {rank}
                    </div>
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-2">
                        <Flag team={row.team} size={20} />
                        <div className="truncate text-[13px] font-semibold">{row.team}</div>
                      </div>
                      <div className="mt-1 text-[9px]" style={{ color: `${theme.accent}42` }}>
                        Group {row.group} · {ownerByTeam.get(row.team) ?? 'Unassigned'}
                      </div>
                    </div>
                  </div>

                  <span
                    className="font-heading rounded-full px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[2px]"
                    style={{
                      background: `${statusTone}12`,
                      color: statusTone,
                      border: `1px solid ${statusTone}24`,
                    }}>
                    {qualified ? 'In' : 'Out'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <StatTile label="Pts" value={row.pts} />
                  <StatTile label="GD" value={row.gd > 0 ? `+${row.gd}` : row.gd} />
                  <StatTile label="GF" value={row.gf} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
