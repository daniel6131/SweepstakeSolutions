import { Flag } from '@/components/ui/Flag';
import { getLivePhase } from '@/lib/match-time';
import type { LiveTeamSwing } from '@/lib/provisional';

// Saturated tokens drive the chip border + tint (recognizable hue). The TEXT,
// being small (9-10px), is lifted toward white so it clears WCAG AA (>= 4.5:1)
// over the tint on the card surface: pure --color-success / --color-danger fall
// just short there (~4.3 / ~3.2:1). Warning and accent already pass, so they
// stay on the token.
const STATE_TINT: Record<LiveTeamSwing['state'], string> = {
  winning: 'var(--color-success)',
  drawing: 'var(--color-warning)',
  losing: 'var(--color-danger)',
};
const STATE_TEXT: Record<LiveTeamSwing['state'], string> = {
  winning: 'color-mix(in srgb, var(--color-success) 80%, white)',
  drawing: 'var(--color-warning)',
  losing: 'color-mix(in srgb, var(--color-danger) 58%, white)',
};
const UP_TINT = 'var(--color-success)';
const UP_TEXT = 'color-mix(in srgb, var(--color-success) 80%, white)';
const DOWN_TINT = 'var(--color-danger)';
const DOWN_TEXT = 'color-mix(in srgb, var(--color-danger) 58%, white)';

/** ▲/▼ how many places a player would move if every live match ended now. */
export function MovementChip({ delta, size = 'sm' }: { delta: number; size?: 'sm' | 'xs' }) {
  if (delta === 0) return null;
  const up = delta > 0;
  const magnitude = Math.abs(delta);
  const tint = up ? UP_TINT : DOWN_TINT;
  const text = up ? UP_TEXT : DOWN_TEXT;

  return (
    <span
      className={`font-heading inline-flex items-center gap-0.5 rounded-full font-bold tabular-nums ${
        size === 'xs' ? 'px-1 py-px text-[9px]' : 'px-1.5 py-px text-[10px]'
      }`}
      style={{ color: text, background: `color-mix(in srgb, ${tint} 14%, transparent)` }}
      aria-label={`${up ? 'Up' : 'Down'} ${magnitude} ${magnitude === 1 ? 'place' : 'places'} if it ended now`}>
      <span aria-hidden>
        {up ? '▲' : '▼'}
        {magnitude}
      </span>
    </span>
  );
}

/** One owned team currently on the pitch, scoreline coloured by its live result. */
export function LiveTeamChip({ swing, nowMs }: { swing: LiveTeamSwing; nowMs: number | null }) {
  const tint = STATE_TINT[swing.state];
  const text = STATE_TEXT[swing.state];
  // Approximate live minute (or HT/ET/PENS) for this team's match, ticked client-side.
  const phase = getLivePhase(
    {
      status: 'live',
      utcDate: swing.kickoffUtc,
      detailedStatus: swing.detailedStatus,
      halfTimeRecorded: swing.halfTimeRecorded,
    },
    nowMs ?? Number.NaN
  );

  return (
    <span
      className="font-heading inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums"
      style={{
        border: `1px solid color-mix(in srgb, ${tint} 45%, transparent)`,
        background: `color-mix(in srgb, ${tint} 12%, transparent)`,
        color: 'var(--color-fg)',
      }}
      title={`${swing.team} ${swing.state} ${swing.gf}–${swing.ga} live against ${swing.opponent}${
        phase.label ? ` (${phase.label})` : ''
      }`}>
      <span className="provisional-live-dot" style={{ background: tint }} aria-hidden />
      <Flag team={swing.team} size={13} />
      <span style={{ color: text }}>
        {swing.gf}–{swing.ga}
      </span>
      {phase.label && (
        <span style={{ color: 'var(--color-fg-subtle)' }} aria-hidden>
          {phase.label}
        </span>
      )}
    </span>
  );
}
