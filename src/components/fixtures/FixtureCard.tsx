import { Flag } from '@/components/ui/Flag';
import { getFixtureDisplayParts, getLivePhase } from '@/lib/match-time';
import type { Fixture, ThemeColors } from '@/types';
import { MapPin } from 'lucide-react';

type Props = {
  fixture: Fixture;
  ownerByTeam: Map<string, string>;
  theme: ThemeColors;
  timeZone: string | null;
  /** Ticking clock (epoch ms) for the live phase label; null before client mount. */
  nowMs: number | null;
};

export function FixtureCard({ fixture: f, ownerByTeam, theme, timeZone, nowMs }: Props) {
  const hasScore = f.s1 !== null;
  const isLive = f.status === 'live';
  const isFinished = f.status === 'finished' || (hasScore && !isLive);
  const display = getFixtureDisplayParts(f, timeZone);
  const phase = getLivePhase(f, nowMs ?? Number.NaN);
  const owner = (team: string) => ownerByTeam.get(team) ?? '—';

  return (
    <div
      className="surface-card card-lift overflow-hidden rounded-xl md:rounded-2xl"
      style={{
        fontVariantNumeric: 'tabular-nums',
        ...(isLive
          ? {
              border: `2px solid ${theme.accent}`,
              boxShadow: 'var(--card-highlight), var(--shadow-card), var(--shadow-accent)',
            }
          : isFinished
            ? { border: `1px solid ${theme.accent}22` }
            : {}),
      }}
      data-reveal>
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 py-2.5 md:px-5 md:py-3"
        style={{ background: `${theme.accent}05`, borderBottom: `1px solid ${theme.accent}08` }}>
        <span
          className="font-display rounded-full px-3 py-0.5 text-[10px] tracking-[2px] md:px-3.5 md:py-1 md:text-[11px]"
          style={{ color: theme.bg, background: theme.accent }}>
          GRP {f.group}
        </span>

        {isLive ? (
          <span className="flex items-center gap-2">
            {/* Pulsing live dot (echoes the global LiveIndicator) */}
            <span className="relative flex h-1.5 w-1.5 items-center justify-center">
              <span
                className="absolute inline-flex h-1.5 w-1.5 rounded-full"
                style={{
                  background: theme.accent,
                  animation: 'live-ping 1.8s var(--ease-standard) infinite',
                }}
              />
              <span
                className="relative inline-flex h-1.5 w-1.5 rounded-full"
                style={{
                  background: theme.accent,
                  animation: 'live-dot 1.8s ease-in-out infinite',
                }}
              />
            </span>
            <span
              className="font-heading text-[10px] font-bold uppercase tracking-[2px] md:text-[11px]"
              style={{ color: theme.accent }}>
              Live
            </span>
            {phase.label && (
              <span
                className="font-heading text-[10px] font-semibold tabular-nums md:text-[11px]"
                style={{ color: `${theme.accent}99` }}>
                {phase.label}
              </span>
            )}
          </span>
        ) : isFinished ? (
          <span
            className="font-heading text-[10px] font-bold uppercase tracking-[2px] md:text-[11px]"
            style={{ color: `${theme.accent}55` }}>
            Full time
          </span>
        ) : (
          <span
            className="font-heading text-[10px] font-semibold md:text-[11px]"
            style={{ color: `${theme.accent}55` }}>
            {display.dateLabel} · {display.timeWithZoneLabel}
          </span>
        )}
      </div>

      {/* Teams + score */}
      <div className="flex items-center justify-between px-4 py-4 md:px-5 md:py-5">
        <div className="flex-1">
          <Flag team={f.t1} size={32} />
          <div className="font-display mt-1.5 text-[12px] md:text-sm">{f.t1}</div>
          <div
            className="mt-0.5 text-[9px] font-medium md:text-[10px]"
            style={{ color: `${theme.accent}44` }}>
            {owner(f.t1)}
          </div>
        </div>

        <div className="shrink-0 px-2 text-center md:px-4">
          {hasScore ? (
            <div
              className="font-display flex items-center gap-2 md:gap-3"
              style={{ fontSize: 'clamp(28px, 6vw, 40px)' }}>
              <span
                style={{
                  color: isLive ? theme.accent : `${theme.accent}d9`,
                  textShadow: isLive ? `0 0 18px ${theme.accent}88` : undefined,
                }}>
                {f.s1}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.12)', fontSize: '0.5em' }}>—</span>
              <span
                style={{
                  color: isLive ? theme.accent : `${theme.accent}d9`,
                  textShadow: isLive ? `0 0 18px ${theme.accent}88` : undefined,
                }}>
                {f.s2}
              </span>
            </div>
          ) : (
            <div
              className="font-display rounded-lg px-3.5 py-2 text-[11px] tracking-[4px] md:rounded-xl md:px-5 md:py-2.5 md:text-xs"
              style={{ color: 'rgba(255,255,255,0.15)', border: `1.5px solid ${theme.accent}10` }}>
              VS
            </div>
          )}
        </div>

        <div className="flex-1 text-right">
          <div className="flex justify-end">
            <Flag team={f.t2} size={32} />
          </div>
          <div className="font-display mt-1.5 text-[12px] md:text-sm">{f.t2}</div>
          <div
            className="mt-0.5 text-[9px] font-medium md:text-[10px]"
            style={{ color: `${theme.accent}44` }}>
            {owner(f.t2)}
          </div>
        </div>
      </div>

      {/* Venue */}
      <div
        className="font-heading flex items-center justify-center gap-1.5 px-4 py-2.5 text-[10px] font-medium md:text-[11px]"
        style={{ color: 'rgba(255,255,255,0.2)', borderTop: `1px solid ${theme.accent}06` }}>
        <MapPin size={11} />
        {f.venue}
      </div>
    </div>
  );
}
