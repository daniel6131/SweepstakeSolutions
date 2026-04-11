import { Flag } from '@/components/ui/Flag';
import type { LeaderboardEntry, ThemeColors } from '@/types';

type Props = { entries: LeaderboardEntry[]; theme: ThemeColors };

function formatGoalBalance(entry: LeaderboardEntry): string {
  return `${entry.gf}-${entry.ga}`;
}

function formatGoalDifference(goalDifference: number): string {
  return goalDifference > 0 ? `+${goalDifference}` : `${goalDifference}`;
}

export function LeaderboardTable({ entries, theme }: Props) {
  return (
    <div
      className="overflow-hidden rounded-2xl"
      style={{ background: theme.card, border: `1.5px solid ${theme.accent}12` }}
      data-reveal>
      {/* Header — desktop */}
      <div
        className="font-heading hidden items-center px-5 py-3.5 text-[10px] font-bold uppercase tracking-[3px] md:grid"
        style={{
          gridTemplateColumns: '40px minmax(0,1fr) 48px 48px 48px 84px 56px 72px',
          borderBottom: `1px solid ${theme.accent}0A`,
          color: `${theme.accent}35`,
        }}>
        <span>#</span>
        <span>PLAYER</span>
        <span className="text-center">W</span>
        <span className="text-center">D</span>
        <span className="text-center">L</span>
        <span className="text-center">+/-</span>
        <span className="text-center">GD</span>
        <span className="text-right">PTS</span>
      </div>

      {/* Header — mobile */}
      <div
        className="font-heading grid items-center px-4 py-3 text-[9px] font-bold uppercase tracking-[3px] md:hidden"
        style={{
          gridTemplateColumns: '28px 1fr 56px',
          borderBottom: `1px solid ${theme.accent}0A`,
          color: `${theme.accent}35`,
        }}>
        <span>#</span>
        <span>PLAYER</span>
        <span className="text-right">PTS</span>
      </div>

      {entries.map((p, i) => (
        <div key={p.name}>
          {/* Desktop row */}
          <div
            className="row-hover animate-slide-row hidden items-center px-5 py-4 md:grid"
            style={{
              gridTemplateColumns: '40px minmax(0,1fr) 48px 48px 48px 84px 56px 72px',
              borderBottom: i < entries.length - 1 ? `1px solid ${theme.accent}06` : 'none',
              animationDelay: `${i * 0.04}s`,
            }}>
            <span
              className="font-display text-xl"
              style={{ color: i < 3 ? theme.accent : 'rgba(255,255,255,0.15)' }}>
              {i + 1}
            </span>
            <div>
              <div className="mb-1.5 text-[14px] font-bold">{p.name}</div>
              <div className="flex flex-wrap gap-1">
                {p.teams.map((t) => (
                  <div
                    key={t}
                    className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px]"
                    style={{
                      background: `${theme.accent}06`,
                      border: `1px solid ${theme.accent}08`,
                      color: 'rgba(255,255,255,0.4)',
                    }}>
                    <Flag team={t} size={13} />
                    {t}
                  </div>
                ))}
              </div>
            </div>
            <span className="text-center text-[13px] font-bold text-[#4CAF50]">{p.w}</span>
            <span className="text-center text-[13px] font-bold text-[#FFB300]">{p.d}</span>
            <span className="text-center text-[13px] font-bold text-[#ef5350]">{p.l}</span>
            <span
              className="text-center text-[12px] font-bold"
              style={{ color: `${theme.accent}70` }}>
              {formatGoalBalance(p)}
            </span>
            <span
              className="text-center text-[12px] font-bold"
              style={{ color: p.gd >= 0 ? '#4CAF50' : '#ef5350' }}>
              {formatGoalDifference(p.gd)}
            </span>
            <span
              className="font-display text-right text-[32px]"
              style={{ color: p.pts > 0 ? theme.accent : 'rgba(255,255,255,0.08)' }}>
              {p.pts}
            </span>
          </div>

          {/* Mobile row */}
          <div
            className="row-hover animate-slide-row grid items-center px-4 py-3.5 md:hidden"
            style={{
              gridTemplateColumns: '28px 1fr 56px',
              borderBottom: i < entries.length - 1 ? `1px solid ${theme.accent}06` : 'none',
              animationDelay: `${i * 0.04}s`,
            }}>
            <span
              className="font-display text-base"
              style={{ color: i < 3 ? theme.accent : 'rgba(255,255,255,0.15)' }}>
              {i + 1}
            </span>
            <div className="min-w-0">
              <div className="text-[13px] font-bold">{p.name}</div>
              <div className="mt-0.5 flex gap-1 overflow-hidden">
                {p.teams.map((t) => (
                  <Flag key={t} team={t} size={12} />
                ))}
              </div>
              <div className="mt-1 flex gap-2 text-[10px]">
                <span className="text-[#4CAF50]">{p.w}W</span>
                <span className="text-[#FFB300]">{p.d}D</span>
                <span className="text-[#ef5350]">{p.l}L</span>
                <span style={{ color: `${theme.accent}70` }}>{formatGoalBalance(p)}</span>
                <span className={p.gd >= 0 ? 'text-[#4CAF50]' : 'text-[#ef5350]'}>
                  {formatGoalDifference(p.gd)} GD
                </span>
              </div>
            </div>
            <span
              className="font-display text-right text-[28px]"
              style={{ color: p.pts > 0 ? theme.accent : 'rgba(255,255,255,0.08)' }}>
              {p.pts}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
