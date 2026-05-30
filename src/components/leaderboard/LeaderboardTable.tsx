import { Flag } from '@/components/ui/Flag';
import type { LeaderboardEntry, ThemeColors } from '@/types';

type Props = { entries: LeaderboardEntry[]; theme: ThemeColors };

function formatGoalBalance(entry: LeaderboardEntry): string {
  return `${entry.gf}-${entry.ga}`;
}

function formatGD(gd: number): string {
  return gd > 0 ? `+${gd}` : `${gd}`;
}

function GDColor({ gd, children }: { gd: number; children: React.ReactNode }) {
  return (
    <span style={{ color: gd >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
      {children}
    </span>
  );
}

export function LeaderboardTable({ entries, theme }: Props) {
  return (
    <div
      className="surface-card overflow-hidden rounded-2xl"
      style={{ fontVariantNumeric: 'tabular-nums' }}
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
              boxShadow: i === 0 ? 'inset 3px 0 0 0 var(--color-accent)' : undefined,
              animationDelay: `${i * 0.04}s`,
            }}>
            <span
              className="font-display text-xl"
              style={{ color: i < 3 ? theme.accent : 'var(--color-fg-subtle)' }}>
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
                      color: 'var(--color-fg-muted)',
                    }}>
                    <Flag team={t} size={13} />
                    {t}
                  </div>
                ))}
              </div>
            </div>
            <span
              className="text-center text-[13px] font-bold"
              style={{ color: 'var(--color-success)' }}>
              {p.w}
            </span>
            <span
              className="text-center text-[13px] font-bold"
              style={{ color: 'var(--color-warning)' }}>
              {p.d}
            </span>
            <span
              className="text-center text-[13px] font-bold"
              style={{ color: 'var(--color-danger)' }}>
              {p.l}
            </span>
            <span
              className="text-center text-[12px] font-bold"
              style={{ color: `${theme.accent}70` }}>
              {formatGoalBalance(p)}
            </span>
            <GDColor gd={p.gd}>
              <span className="block text-center text-[12px] font-bold">{formatGD(p.gd)}</span>
            </GDColor>
            <span
              className="font-display text-right text-[32px]"
              style={{ color: p.pts > 0 ? theme.accent : 'var(--color-fg-subtle)' }}>
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
              style={{ color: i < 3 ? theme.accent : 'var(--color-fg-subtle)' }}>
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
                <span style={{ color: 'var(--color-success)' }}>{p.w}W</span>
                <span style={{ color: 'var(--color-warning)' }}>{p.d}D</span>
                <span style={{ color: 'var(--color-danger)' }}>{p.l}L</span>
                <span style={{ color: `${theme.accent}70` }}>{formatGoalBalance(p)}</span>
                <GDColor gd={p.gd}>{formatGD(p.gd)} GD</GDColor>
              </div>
            </div>
            <span
              className="font-display text-right text-[28px]"
              style={{ color: p.pts > 0 ? theme.accent : 'var(--color-fg-subtle)' }}>
              {p.pts}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
