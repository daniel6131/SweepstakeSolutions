import { KnockoutBracket } from '@/components/fixtures/KnockoutBracket';
import { GroupTable } from '@/components/groups/GroupTable';
import { LeaderboardTable } from '@/components/leaderboard/LeaderboardTable';
import { Podium } from '@/components/leaderboard/Podium';
import { GROUP_IDS } from '@/data/groups';
import type { ProjectedKnockoutBracket } from '@/lib/knockout';
import type {
  GroupId,
  GroupStanding,
  LeaderboardEntry,
  ThemeColors,
  TournamentGroups,
} from '@/types';

const DEV_THEME: ThemeColors = {
  bg: '#08111b',
  accent: '#7ef2cf',
  accent2: '#67b7ff',
  card: '#0f1b28',
};

type Props = {
  leaderboard: LeaderboardEntry[];
  standings: Record<GroupId, GroupStanding[]>;
  groups: TournamentGroups;
  bracket: ProjectedKnockoutBracket;
  ownerByTeam: Map<string, string>;
};

export function PreviewPanel({ leaderboard, standings, groups, bracket, ownerByTeam }: Props) {
  return (
    <section className="space-y-8">
      <div>
        <div
          className="font-heading mb-2 text-[10px] font-bold uppercase tracking-[3px]"
          style={{ color: `${DEV_THEME.accent}58` }}>
          Preview
        </div>
        <div
          className="font-display text-[34px] leading-none tracking-[-0.05em]"
          style={{ color: DEV_THEME.accent }}>
          Recomputed outputs
        </div>
      </div>

      <div>
        <Podium top3={leaderboard.slice(0, 3)} theme={DEV_THEME} />
        <LeaderboardTable entries={leaderboard} theme={DEV_THEME} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(340px,1fr))] md:gap-4">
        {GROUP_IDS.map((group) => (
          <GroupTable
            key={group}
            group={group}
            teams={groups[group]}
            ownerByTeam={ownerByTeam}
            standings={standings[group]}
            theme={DEV_THEME}
          />
        ))}
      </div>

      <KnockoutBracket
        bracket={bracket}
        ownerByTeam={ownerByTeam}
        theme={DEV_THEME}
        timeZone={null}
      />
    </section>
  );
}
