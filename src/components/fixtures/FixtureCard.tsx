import { Flag } from '@/components/ui/Flag';
import { getOwner } from '@/data/participants';
import type { Fixture, ThemeColors } from '@/types';
import { MapPin } from 'lucide-react';

type Props = { fixture: Fixture; theme: ThemeColors };

export function FixtureCard({ fixture: f, theme }: Props) {
  const hasScore = f.s1 !== null;

  return (
    <div
      className="card-lift overflow-hidden rounded-xl md:rounded-2xl"
      style={{
        background: theme.card,
        border: hasScore ? `2px solid ${theme.accent}35` : `1.5px solid ${theme.accent}0D`,
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
        <span
          className="font-heading text-[10px] font-semibold md:text-[11px]"
          style={{ color: `${theme.accent}55` }}>
          {f.date} · {f.time}
        </span>
      </div>

      {/* Teams + score */}
      <div className="flex items-center justify-between px-4 py-4 md:px-5 md:py-5">
        <div className="flex-1">
          <Flag team={f.t1} size={32} />
          <div className="font-display mt-1.5 text-[12px] md:text-sm">{f.t1}</div>
          <div
            className="mt-0.5 text-[9px] font-medium md:text-[10px]"
            style={{ color: `${theme.accent}44` }}>
            {getOwner(f.t1)}
          </div>
        </div>

        <div className="shrink-0 px-2 text-center md:px-4">
          {hasScore ? (
            <div
              className="font-display flex items-center gap-2 md:gap-3"
              style={{ fontSize: 'clamp(28px, 6vw, 40px)' }}>
              <span style={{ color: theme.accent }}>{f.s1}</span>
              <span style={{ color: 'rgba(255,255,255,0.12)', fontSize: '0.5em' }}>—</span>
              <span style={{ color: theme.accent }}>{f.s2}</span>
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
            {getOwner(f.t2)}
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
