import { LeaderboardTable } from '@/components/leaderboard/LeaderboardTable';
import { Podium } from '@/components/leaderboard/Podium';
import { SectionHeading } from '@/components/ui/SectionHeading';
import type { LeaderboardEntry, ThemeColors } from '@/types';

type Props = { entries: LeaderboardEntry[]; theme: ThemeColors };

export function LeaderboardTab({ entries, theme }: Props) {
  return (
    <div>
      <SectionHeading overline="STANDINGS" line1="LEADERBOARD" accent={theme.accent} />
      <Podium top3={entries.slice(0, 3)} theme={theme} />
      <LeaderboardTable entries={entries} theme={theme} />
    </div>
  );
}
