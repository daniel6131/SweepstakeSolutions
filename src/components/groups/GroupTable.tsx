import { Flag } from '@/components/ui/Flag';
import { getOwner } from '@/data/participants';
import type { GroupId, GroupStanding, ThemeColors } from '@/types';

type Props = { group: GroupId; teams: string[]; standings: GroupStanding[]; theme: ThemeColors };

export function GroupTable({ group, teams, standings, theme }: Props) {
  return (
    <div
      className="overflow-hidden rounded-xl md:rounded-2xl"
      style={{ background: theme.card, border: `1.5px solid ${theme.accent}10` }}
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
          gridTemplateColumns: '1fr repeat(6,30px) 44px',
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
      {standings.map((row, ri) => (
        <div key={row.team}>
          {/* Desktop row */}
          <div
            className="row-hover hidden items-center px-4 py-2.5 md:grid"
            style={{
              gridTemplateColumns: '1fr repeat(6,30px) 44px',
              borderBottom: ri < 3 ? `1px solid ${theme.accent}05` : 'none',
              borderLeft: ri < 2 ? `3px solid ${theme.accent}35` : '3px solid transparent',
            }}>
            <div className="flex items-center gap-2">
              <Flag team={row.team} size={20} />
              <div>
                <div className="text-[12px] font-semibold">{row.team}</div>
                <div className="text-[8px]" style={{ color: `${theme.accent}35` }}>
                  {getOwner(row.team)}
                </div>
              </div>
            </div>
            {[row.p, row.w, row.d, row.l, row.gf, row.ga].map((v, vi) => (
              <span
                key={vi}
                className="text-center text-[12px]"
                style={{ color: 'rgba(255,255,255,0.3)' }}>
                {v}
              </span>
            ))}
            <span
              className="font-display text-right text-lg"
              style={{ color: row.pts > 0 ? theme.accent : 'rgba(255,255,255,0.08)' }}>
              {row.pts}
            </span>
          </div>

          {/* Mobile row */}
          <div
            className="row-hover grid items-center px-4 py-2.5 md:hidden"
            style={{
              gridTemplateColumns: '1fr 28px 28px 28px 40px',
              borderBottom: ri < 3 ? `1px solid ${theme.accent}05` : 'none',
              borderLeft: ri < 2 ? `3px solid ${theme.accent}35` : '3px solid transparent',
            }}>
            <div className="flex items-center gap-2">
              <Flag team={row.team} size={18} />
              <div className="min-w-0">
                <div className="truncate text-[12px] font-semibold">{row.team}</div>
                <div className="text-[8px]" style={{ color: `${theme.accent}30` }}>
                  {getOwner(row.team)}
                </div>
              </div>
            </div>
            <span className="text-center text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {row.w}
            </span>
            <span className="text-center text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {row.d}
            </span>
            <span className="text-center text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {row.l}
            </span>
            <span
              className="font-display text-right text-base"
              style={{ color: row.pts > 0 ? theme.accent : 'rgba(255,255,255,0.08)' }}>
              {row.pts}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
