import { Flag } from '@/components/ui/Flag';
import type { GroupId, GroupStanding, ThemeColors } from '@/types';

type Props = {
  group: GroupId;
  teams: string[];
  ownerByTeam: Map<string, string>;
  standings: GroupStanding[];
  theme: ThemeColors;
};

/** Qualification zone by finishing position (0-indexed). */
function zoneColor(rank: number): string {
  if (rank < 2) return 'var(--color-accent)'; // top 2 advance
  if (rank === 2) return 'var(--color-warning)'; // 3rd → best-thirds race
  return 'transparent'; // eliminated
}

const COLS = '20px minmax(0,1fr) 54px 36px 38px';

export function GroupTable({ group, teams, ownerByTeam, standings, theme }: Props) {
  return (
    <div
      className="surface-card overflow-hidden rounded-xl md:rounded-2xl"
      style={{ fontVariantNumeric: 'tabular-nums' }}
      data-reveal>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3.5 md:px-5"
        style={{ background: `${theme.accent}07`, borderBottom: '1px solid var(--card-border)' }}>
        <div className="flex items-center gap-3">
          <div
            className="font-display flex h-10 w-10 items-center justify-center rounded-xl text-lg"
            style={{
              background: `${theme.accent}16`,
              border: `1px solid ${theme.accent}2e`,
              color: theme.accent,
            }}>
            {group}
          </div>
          <div>
            <div
              className="font-display text-[15px] leading-none"
              style={{ color: 'var(--color-fg)' }}>
              Group {group}
            </div>
            <div
              className="font-heading mt-1.5 text-[8px] font-bold tracking-[2px] uppercase"
              style={{ color: `${theme.accent}55` }}>
              Top 2 advance
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          {teams.map((t) => (
            <Flag key={t} team={t} size={18} />
          ))}
        </div>
      </div>

      {/* Column header */}
      <div
        className="font-heading grid items-center gap-2 px-4 py-2 text-[8px] font-bold tracking-[1.5px] uppercase"
        style={{ gridTemplateColumns: COLS, color: `${theme.accent}40` }}>
        <span />
        <span>Team</span>
        <span className="text-center">W-D-L</span>
        <span className="text-center">GD</span>
        <span className="text-right">Pts</span>
      </div>

      {/* Rows */}
      {standings.map((row, ri) => {
        const zone = zoneColor(ri);
        const gd = row.gf - row.ga;
        const qualifying = ri < 2;
        return (
          <div
            key={row.team}
            className="row-hover grid items-center gap-2 px-4 py-2.5"
            style={{
              gridTemplateColumns: COLS,
              boxShadow: zone !== 'transparent' ? `inset 3px 0 0 0 ${zone}` : undefined,
              background: qualifying ? 'var(--color-accent-a4)' : undefined,
              borderTop: ri > 0 ? '1px solid var(--color-accent-a8)' : undefined,
            }}>
            <span
              className="font-display text-[15px]"
              style={{ color: zone === 'transparent' ? 'var(--color-fg-subtle)' : zone }}>
              {ri + 1}
            </span>
            <div className="flex min-w-0 items-center gap-2">
              <Flag team={row.team} size={20} />
              <div className="min-w-0">
                <div className="truncate text-[12px] font-semibold" title={row.team}>
                  {row.team}
                </div>
                <div
                  className="truncate text-[8px]"
                  title={ownerByTeam.get(row.team) ?? '—'}
                  style={{ color: `${theme.accent}48` }}>
                  {ownerByTeam.get(row.team) ?? '—'}
                </div>
              </div>
            </div>
            <span
              className="text-center text-[11px] font-medium"
              style={{ color: 'var(--color-fg-muted)' }}>
              {row.w}-{row.d}-{row.l}
            </span>
            <span
              className="text-center text-[11px] font-semibold"
              style={{
                color:
                  gd > 0
                    ? 'var(--color-success)'
                    : gd < 0
                      ? 'var(--color-danger)'
                      : 'var(--color-fg-subtle)',
              }}>
              {gd > 0 ? `+${gd}` : gd}
            </span>
            <span
              className="font-display text-right text-[19px]"
              style={{ color: row.pts > 0 ? theme.accent : 'var(--color-fg-subtle)' }}>
              {row.pts}
            </span>
          </div>
        );
      })}

      {/* Legend */}
      <div
        className="font-heading flex items-center gap-4 px-4 py-2.5 text-[8px] font-bold tracking-[1.5px] uppercase"
        style={{ borderTop: '1px solid var(--card-border)', color: `${theme.accent}50` }}>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: 'var(--color-accent)' }} />
          Advance
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: 'var(--color-warning)' }} />
          3rd-place race
        </span>
      </div>
    </div>
  );
}
