import { Flag } from '@/components/ui/Flag';
import { getTeamGroup } from '@/data/groups';
import type { TeamRecord } from '@/lib/scoring';
import type { LeaderboardEntry, ThemeColors, TournamentGroups } from '@/types';
import type { CSSProperties } from 'react';

type Props = {
  entry: LeaderboardEntry;
  rank: number;
  groups: TournamentGroups;
  teamRecords: Map<string, TeamRecord>;
  theme: ThemeColors;
};

const MEDAL: Record<number, string> = {
  1: 'var(--color-medal-gold)',
  2: 'var(--color-medal-silver)',
  3: 'var(--color-medal-bronze)',
};

const EMPTY: TeamRecord = { w: 0, d: 0, l: 0, pts: 0, gf: 0, ga: 0, gd: 0 };

export function ParticipantCard({ entry, rank, groups, teamRecords, theme }: Props) {
  const games = entry.w + entry.d + entry.l;
  const records = entry.teams.map((team) => ({
    team,
    group: getTeamGroup(team, groups),
    r: teamRecords.get(team) ?? EMPTY,
  }));
  const maxTeamPts = Math.max(0, ...records.map((x) => x.r.pts));
  const medal = MEDAL[rank];

  return (
    <div
      className="surface-card card-lift overflow-hidden rounded-xl md:rounded-2xl"
      style={{ fontVariantNumeric: 'tabular-nums' }}
      data-reveal>
      {/* Header — rank medal · name · total points */}
      <div
        className="flex items-center justify-between gap-3 px-4 py-3.5 md:px-5"
        style={{ background: `${theme.accent}08`, borderBottom: '1px solid var(--card-border)' }}>
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="font-display flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base"
            style={{
              background: medal
                ? `color-mix(in srgb, ${medal} 14%, transparent)`
                : `${theme.accent}0d`,
              border: `1.5px solid ${
                medal ? `color-mix(in srgb, ${medal} 55%, transparent)` : `${theme.accent}24`
              }`,
              color: medal ?? theme.accent,
            }}>
            {rank}
          </div>
          <div className="min-w-0">
            <div
              className="font-display truncate text-[18px] leading-none md:text-[20px]"
              style={{ color: 'var(--color-fg)' }}>
              {entry.name}
            </div>
            <div
              className="font-heading mt-1.5 text-[9px] font-bold tracking-[1.5px] uppercase"
              style={{ color: `${theme.accent}55` }}>
              {games} {games === 1 ? 'game' : 'games'} played
            </div>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div
            className="font-display leading-none"
            style={{
              fontSize: 'clamp(28px, 5vw, 38px)',
              color: entry.pts > 0 ? theme.accent : 'var(--color-fg-subtle)',
            }}>
            {entry.pts}
          </div>
          <div
            className="font-heading text-[8px] font-bold tracking-[2px] uppercase"
            style={{ color: `${theme.accent}45` }}>
            pts
          </div>
        </div>
      </div>

      {/* Squad — each team with a points-contribution bar */}
      <div className="p-2 md:p-2.5">
        {records.map(({ team, group, r }, i) => {
          const ratio = maxTeamPts > 0 ? r.pts / maxTeamPts : 0;
          const isTop = r.pts > 0 && r.pts === maxTeamPts;
          return (
            <div
              key={team}
              className="row-hover rounded-lg px-2.5 py-2 md:px-3"
              style={{
                boxShadow: isTop ? `inset 3px 0 0 0 ${theme.accent}` : undefined,
                marginTop: i > 0 ? 2 : 0,
              }}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <Flag team={team} size={24} />
                  <div className="min-w-0">
                    <div className="truncate text-[12px] font-semibold">{team}</div>
                    <div
                      className="font-heading text-[8px] font-bold tracking-[1px] uppercase"
                      style={{ color: `${theme.accent}55` }}>
                      Grp {group} · {r.w}-{r.d}-{r.l}
                    </div>
                  </div>
                </div>
                <span
                  className="font-display text-[18px]"
                  style={{ color: r.pts > 0 ? theme.accent : 'var(--color-fg-subtle)' }}>
                  {r.pts}
                </span>
              </div>
              <div
                className="mt-1.5 h-1 overflow-hidden rounded-full"
                style={{ background: 'var(--color-accent-a8)' }}>
                <span
                  className="block h-full w-full rounded-full"
                  style={
                    {
                      '--ratio': ratio,
                      transformOrigin: 'left',
                      transform: `scaleX(${ratio})`,
                      background: `linear-gradient(90deg, ${theme.accent2}, ${theme.accent})`,
                      animation: 'race-grow 0.9s var(--ease-emphasized) both',
                    } as CSSProperties
                  }
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
