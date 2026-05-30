import { Flag } from '@/components/ui/Flag';
import type { GroupId, GroupStanding, ThemeColors } from '@/types';

type Props = {
  group: GroupId;
  teams: string[];
  ownerByTeam: Map<string, string>;
  standings: GroupStanding[];
  theme: ThemeColors;
};

export function GroupTable({ group, teams, ownerByTeam, standings, theme }: Props) {
  return (
    <div
      className="surface-card overflow-hidden rounded-xl md:rounded-2xl"
      style={{ fontVariantNumeric: 'tabular-nums' }}
      data-reveal>
      {/* Group header */}
      <div
        className="flex items-center justify-between px-4 py-3 md:px-5 md:py-4"
        style={{ background: `${theme.accent}05`, borderBottom: `1px solid ${theme.accent}0A` }}>
        <div className="flex items-center gap-2.5 md:gap-3">
          <div
            className="font-display flex h-9 w-9 items-center justify-center rounded-lg text-base md:h-10 md:w-10 md:rounded-xl md:text-lg"
            style={{
              background: `${theme.accent}10`,
              border: `1.5px solid ${theme.accent}20`,
              color: theme.accent,
            }}>
            {group}
          </div>
          <span className="overline" style={{ color: `${theme.accent}55`, opacity: 1 }}>
            GROUP {group}
          </span>
        </div>
        <div className="flex gap-1">
          {teams.map((t) => (
            <Flag key={t} team={t} size={18} />
          ))}
        </div>
      </div>

      {/* Desktop header */}
      <div
        className="font-heading hidden px-4 py-2 text-[9px] font-bold uppercase tracking-[2px] md:grid"
        style={{
          gridTemplateColumns: 'minmax(0,1fr) repeat(6,30px) 44px',
          borderBottom: `1px solid ${theme.accent}06`,
          color: `${theme.accent}28`,
        }}>
        <span>TEAM</span>
        {['P', 'W', 'D', 'L', 'GF', 'GA'].map((h) => (
          <span key={h} className="text-center">
            {h}
          </span>
        ))}
        <span className="text-right">PTS</span>
      </div>

      {/* Mobile header */}
      <div
        className="font-heading grid px-4 py-2 text-[9px] font-bold uppercase tracking-[2px] md:hidden"
        style={{
          gridTemplateColumns: '1fr 28px 28px 28px 40px',
          borderBottom: `1px solid ${theme.accent}06`,
          color: `${theme.accent}28`,
        }}>
        <span>TEAM</span>
        <span className="text-center">W</span>
        <span className="text-center">D</span>
        <span className="text-center">L</span>
        <span className="text-right">PTS</span>
      </div>

      {/* Rows */}
      {standings.map((row, ri) => {
        const qualifying = ri < 2;
        const rowBg = qualifying ? `${theme.accent}06` : 'transparent';
        const rowBorder = ri < 3 ? `1px solid ${theme.accent}05` : 'none';

        return (
          <div key={row.team}>
            {/* Desktop row */}
            <div
              className="row-hover hidden items-center px-4 py-2.5 md:grid"
              style={{
                gridTemplateColumns: 'minmax(0,1fr) repeat(6,30px) 44px',
                borderBottom: rowBorder,
                background: rowBg,
              }}>
              <div className="flex min-w-0 items-center gap-2">
                <Flag team={row.team} size={20} />
                <div className="min-w-0">
                  <div className="truncate text-[12px] font-semibold" title={row.team}>
                    {row.team}
                  </div>
                  <div
                    className="truncate text-[8px]"
                    title={ownerByTeam.get(row.team) ?? '—'}
                    style={{ color: `${theme.accent}35` }}>
                    {ownerByTeam.get(row.team) ?? '—'}
                  </div>
                </div>
              </div>
              {[row.p, row.w, row.d, row.l, row.gf, row.ga].map((v, vi) => (
                <span
                  key={vi}
                  className="text-center text-[12px]"
                  style={{ color: 'var(--color-fg-subtle)' }}>
                  {v}
                </span>
              ))}
              <span
                className="font-display text-right text-lg"
                style={{ color: row.pts > 0 ? theme.accent : 'var(--color-fg-subtle)' }}>
                {row.pts}
              </span>
            </div>

            {/* Mobile row */}
            <div
              className="row-hover grid items-center px-4 py-2.5 md:hidden"
              style={{
                gridTemplateColumns: '1fr 28px 28px 28px 40px',
                borderBottom: rowBorder,
                background: rowBg,
              }}>
              <div className="flex items-center gap-2">
                <Flag team={row.team} size={18} />
                <div className="min-w-0">
                  <div className="truncate text-[12px] font-semibold" title={row.team}>
                    {row.team}
                  </div>
                  <div
                    className="truncate text-[8px]"
                    title={ownerByTeam.get(row.team) ?? '—'}
                    style={{ color: `${theme.accent}30` }}>
                    {ownerByTeam.get(row.team) ?? '—'}
                  </div>
                </div>
              </div>
              <span className="text-center text-[11px]" style={{ color: 'var(--color-fg-subtle)' }}>
                {row.w}
              </span>
              <span className="text-center text-[11px]" style={{ color: 'var(--color-fg-subtle)' }}>
                {row.d}
              </span>
              <span className="text-center text-[11px]" style={{ color: 'var(--color-fg-subtle)' }}>
                {row.l}
              </span>
              <span
                className="font-display text-right text-base"
                style={{ color: row.pts > 0 ? theme.accent : 'var(--color-fg-subtle)' }}>
                {row.pts}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
