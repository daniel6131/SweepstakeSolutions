import { Flag } from '@/components/ui/Flag';
import { getTeamGroup } from '@/data/groups';
import type { TeamRecord } from '@/lib/scoring';
import type { LeaderboardEntry, ThemeColors, TournamentGroups } from '@/types';

type Props = {
  entry: LeaderboardEntry;
  rank: number;
  groups: TournamentGroups;
  teamRecords: Map<string, TeamRecord>;
  theme: ThemeColors;
};

export function ParticipantCard({ entry, rank, groups, teamRecords, theme }: Props) {
  return (
    <div
      className="card-lift overflow-hidden rounded-xl md:rounded-2xl"
      style={{ background: theme.card, border: `1.5px solid ${theme.accent}10` }}
      data-reveal>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 pt-4 pb-3 md:px-6 md:pt-6 md:pb-4"
        style={{ background: `${theme.accent}04`, borderBottom: `1px solid ${theme.accent}08` }}>
        <div>
          <div
            className="font-display leading-none"
            style={{ fontSize: 'clamp(22px, 4vw, 30px)', color: theme.accent }}>
            {entry.name}
          </div>
          <div
            className="font-heading mt-1.5 text-[11px] font-medium"
            style={{ color: 'var(--color-fg-subtle)' }}>
            {entry.pts} pts · {entry.w + entry.d + entry.l} games
          </div>
        </div>
        <div
          className="font-display leading-none"
          style={{ fontSize: 'clamp(36px, 6vw, 52px)', color: `${theme.accent}06` }}>
          {rank}
        </div>
      </div>

      {/* Team list */}
      <div className="p-2.5 md:p-3">
        {entry.teams.map((t) => {
          const group = getTeamGroup(t, groups);
          const r = teamRecords.get(t) ?? { w: 0, d: 0, l: 0, pts: 0 };
          return (
            <div
              key={t}
              className="row-hover mb-0.5 flex items-center justify-between rounded-lg px-3 py-2.5 md:rounded-xl md:px-4 md:py-3">
              <div className="flex items-center gap-2.5 md:gap-3">
                <Flag team={t} size={26} />
                <div>
                  <div className="text-[13px] font-semibold">{t}</div>
                  <div className="text-[9px]" style={{ color: 'var(--color-fg-subtle)' }}>
                    {r.w}W · {r.d}D · {r.l}L
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 md:gap-3">
                <span
                  className="font-heading hidden rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider sm:inline-block"
                  style={{ color: theme.accent, background: `${theme.accent}0A` }}>
                  GRP {group}
                </span>
                <span
                  className="font-display w-8 text-right text-xl md:w-10 md:text-2xl"
                  style={{ color: r.pts > 0 ? theme.accent : 'var(--color-fg-subtle)' }}>
                  {r.pts}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
