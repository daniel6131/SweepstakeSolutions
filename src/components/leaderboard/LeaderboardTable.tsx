import { Flag } from '@/components/ui/Flag';
import type { CSSProperties } from 'react';
import type { LeaderboardEntry, ThemeColors } from '@/types';

type Props = { entries: LeaderboardEntry[]; theme: ThemeColors };

function formatGD(gd: number): string {
  return gd > 0 ? `+${gd}` : `${gd}`;
}

/** Compact W-D-L "form" segments — proportional, color-coded. */
function FormBar({ w, d, l }: { w: number; d: number; l: number }) {
  const total = w + d + l;
  if (total === 0) {
    return (
      <span className="text-[11px] font-medium" style={{ color: 'var(--color-fg-subtle)' }}>
        no games yet
      </span>
    );
  }
  const seg = (n: number, color: string) =>
    n > 0 ? <span style={{ flex: n, background: color, height: '100%' }} /> : null;
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="flex h-1.5 w-16 overflow-hidden rounded-full md:w-20"
        style={{ background: 'var(--color-accent-a8)' }}>
        {seg(w, 'var(--color-success)')}
        {seg(d, 'var(--color-warning)')}
        {seg(l, 'var(--color-danger)')}
      </div>
      <span
        className="font-heading hidden text-[11px] font-semibold tabular-nums sm:inline"
        style={{ color: 'var(--color-fg-muted)' }}>
        {w}–{d}–{l}
      </span>
    </div>
  );
}

export function LeaderboardTable({ entries, theme }: Props) {
  const maxPts = entries.reduce((m, e) => Math.max(m, e.pts), 0);
  const preTournament = maxPts === 0;

  return (
    <ol
      className="surface-card overflow-hidden rounded-2xl"
      style={{ fontVariantNumeric: 'tabular-nums' }}
      data-reveal>
      {entries.map((p, i) => {
        const rank = i + 1;
        const isLeader = !preTournament && i === 0;
        const ratio = maxPts > 0 ? p.pts / maxPts : 0;
        const behind = maxPts - p.pts;
        const gapLabel = preTournament
          ? '—'
          : isLeader
            ? 'LEADER'
            : behind === 0
              ? 'LEVEL'
              : `−${behind}`;
        const rankColor = i < 3 ? theme.accent : 'var(--color-fg-subtle)';

        return (
          <li
            key={p.name}
            className="row-hover animate-slide-row relative px-4 py-4 md:px-6 md:py-[18px]"
            style={{
              borderTop: i > 0 ? '1px solid var(--color-accent-a8)' : undefined,
              boxShadow: isLeader ? 'inset 3px 0 0 0 var(--color-accent)' : undefined,
              background: isLeader ? 'var(--color-accent-a4)' : undefined,
              animationDelay: `${i * 0.045}s`,
            }}>
            {/* Top line: rank · identity · form · points */}
            <div className="flex items-center gap-3 md:gap-5">
              <span
                className="font-display w-6 shrink-0 text-center text-2xl leading-none md:w-9 md:text-3xl"
                style={{ color: rankColor }}>
                {rank}
              </span>

              {/* Monogram */}
              <span
                className="font-display hidden h-10 w-10 shrink-0 items-center justify-center rounded-full text-base sm:flex"
                style={{
                  background: 'var(--color-accent-a8)',
                  border: '1px solid var(--card-border)',
                  color: theme.accent,
                }}>
                {p.name.charAt(0)}
              </span>

              {/* Name + flags */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[15px] font-bold md:text-base">{p.name}</span>
                  {isLeader && (
                    <span
                      className="font-heading rounded px-1.5 py-0.5 text-[9px] font-bold tracking-[1.5px] uppercase"
                      style={{ background: theme.accent, color: theme.bg }}>
                      Leader
                    </span>
                  )}
                </div>
                <div className="mt-1.5 flex items-center gap-1">
                  {p.teams.map((t) => (
                    <Flag key={t} team={t} size={16} />
                  ))}
                </div>
              </div>

              {/* Form (desktop) */}
              <div className="hidden md:block">
                <FormBar w={p.w} d={p.d} l={p.l} />
              </div>

              {/* Points → GD → goals (the leaderboard tiebreaker chain) */}
              <div className="flex shrink-0 flex-col items-end" style={{ width: 76 }}>
                <span
                  className="font-display text-3xl leading-none md:text-[40px]"
                  style={{ color: p.pts > 0 ? theme.accent : 'var(--color-fg-subtle)' }}>
                  {p.pts}
                </span>
                <span
                  className="font-heading mt-1 flex items-center gap-1.5 text-[10px] font-semibold tracking-wider"
                  title={`Goal difference ${formatGD(p.gd)}, goals for ${p.gf}, against ${p.ga}`}>
                  <span
                    style={{
                      color:
                        p.gd > 0
                          ? 'var(--color-success)'
                          : p.gd < 0
                            ? 'var(--color-danger)'
                            : 'var(--color-fg-subtle)',
                    }}>
                    {formatGD(p.gd)} GD
                  </span>
                  <span aria-hidden style={{ color: 'var(--color-fg-subtle)' }}>
                    ·
                  </span>
                  <span className="tabular-nums" style={{ color: 'var(--color-fg-muted)' }}>
                    {p.gf}:{p.ga}
                  </span>
                </span>
              </div>
            </div>

            {/* Race line: gap bar (relative to leader) + gap label */}
            <div className="mt-3 flex items-center gap-3 pl-9 md:pl-15">
              <div
                className="relative h-1.5 flex-1 overflow-hidden rounded-full"
                style={{ background: 'var(--color-accent-a8)' }}>
                <span
                  className="absolute inset-y-0 left-0 w-full rounded-full"
                  style={
                    {
                      '--ratio': ratio,
                      transformOrigin: 'left',
                      transform: `scaleX(${ratio})`,
                      background: `linear-gradient(90deg, ${theme.accent2}, ${theme.accent})`,
                      boxShadow: isLeader ? `0 0 16px ${theme.accent}66` : undefined,
                      animation: 'race-grow 1s var(--ease-emphasized) both',
                      animationDelay: `${0.2 + i * 0.05}s`,
                    } as CSSProperties
                  }
                />
              </div>
              {/* Form (mobile) sits under the bar via the label area on desktop */}
              <span
                className="font-heading w-14 shrink-0 text-right text-[11px] font-semibold tracking-wider tabular-nums"
                style={{ color: isLeader ? theme.accent : 'var(--color-fg-muted)' }}>
                {gapLabel}
              </span>
            </div>

            {/* Form (mobile only) */}
            <div className="mt-2.5 pl-9 md:hidden">
              <FormBar w={p.w} d={p.d} l={p.l} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
