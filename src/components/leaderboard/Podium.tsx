import { Flag } from '@/components/ui/Flag';
import type { LeaderboardEntry, ThemeColors } from '@/types';

type PodiumProps = { top3: LeaderboardEntry[]; theme: ThemeColors };

const MEDALS = ['1ST', '2ND', '3RD'];
const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

export function Podium({ top3, theme }: PodiumProps) {
  return (
    <>
      {/* Desktop podium — 3 columns, 2nd | 1st | 3rd */}
      <div
        className="mx-auto mb-12 hidden max-w-185 grid-cols-3 items-end gap-3 md:grid"
        data-reveal>
        {top3.map((p, i) => {
          const heights = [250, 200, 175];
          const order = [1, 0, 2];
          return (
            <div
              key={p.name}
              style={{
                order: order[i],
                height: heights[i],
                background: theme.card,
                border: i === 0 ? `3px solid ${theme.accent}` : `1.5px solid ${theme.accent}18`,
                borderRadius: 18,
                padding: '22px 14px 18px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
              <div
                className="font-display flex items-center justify-center rounded-full"
                style={{
                  width: 38,
                  height: 38,
                  background: `${MEDAL_COLORS[i]}12`,
                  border: `2px solid ${MEDAL_COLORS[i]}55`,
                  color: MEDAL_COLORS[i],
                  fontSize: 13,
                }}>
                {MEDALS[i]}
              </div>
              <div className="text-center">
                <div
                  className="font-display"
                  style={{ fontSize: i === 0 ? 26 : 20, color: i === 0 ? theme.accent : '#ddd' }}>
                  {p.name}
                </div>
                <div
                  className="font-display mt-1 leading-none"
                  style={{
                    fontSize: i === 0 ? 56 : 40,
                    color: i === 0 ? theme.accent : `${theme.accent}44`,
                  }}>
                  {p.pts}
                </div>
                <div
                  className="overline mt-1.5"
                  style={{ color: `${theme.accent}33`, fontSize: 9, opacity: 1 }}>
                  POINTS
                </div>
              </div>
              <div className="flex gap-1">
                {p.teams.map((t) => (
                  <Flag key={t} team={t} size={18} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile podium — horizontal cards */}
      <div className="mb-8 flex flex-col gap-2.5 md:hidden" data-reveal>
        {top3.map((p, i) => (
          <div
            key={p.name}
            className="flex items-center gap-4 rounded-2xl px-4 py-4"
            style={{
              background: theme.card,
              border: i === 0 ? `2px solid ${theme.accent}` : `1px solid ${theme.accent}12`,
            }}>
            <div
              className="font-display flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs"
              style={{
                background: `${MEDAL_COLORS[i]}12`,
                border: `2px solid ${MEDAL_COLORS[i]}44`,
                color: MEDAL_COLORS[i],
              }}>
              {MEDALS[i]}
            </div>
            <div className="min-w-0 flex-1">
              <div
                className="font-display text-lg"
                style={{ color: i === 0 ? theme.accent : '#ddd' }}>
                {p.name}
              </div>
              <div className="mt-0.5 flex gap-1">
                {p.teams.map((t) => (
                  <Flag key={t} team={t} size={14} />
                ))}
              </div>
            </div>
            <div
              className="font-display text-right"
              style={{ fontSize: 36, color: i === 0 ? theme.accent : `${theme.accent}44` }}>
              {p.pts}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
