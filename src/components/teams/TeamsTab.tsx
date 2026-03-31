'use client';

import { ParticipantCard } from '@/components/teams/ParticipantCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { getTeamRecords } from '@/lib/scoring';
import type { Fixture, LeaderboardEntry, ThemeColors } from '@/types';
import { useMemo } from 'react';

type Props = { entries: LeaderboardEntry[]; fixtures: Fixture[]; theme: ThemeColors };

export function TeamsTab({ entries, fixtures, theme }: Props) {
  const teamRecords = useMemo(() => getTeamRecords(fixtures), [fixtures]);

  return (
    <div>
      <SectionHeading overline="ASSIGNMENTS" line1="YOUR TEAMS" accent={theme.accent} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))] md:gap-4">
        {entries.map((entry, i) => (
          <ParticipantCard
            key={entry.name}
            entry={entry}
            rank={i + 1}
            teamRecords={teamRecords}
            theme={theme}
          />
        ))}
      </div>
    </div>
  );
}
