'use client';

import { BestThirdPlaceTable } from '@/components/groups/BestThirdPlaceTable';
import { GroupTable } from '@/components/groups/GroupTable';
import { Chip } from '@/components/ui/Chip';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { buildProjectedKnockoutBracket } from '@/lib/knockout';
import type { GroupId, GroupStanding, Participant, ThemeColors, TournamentGroups } from '@/types';
import { useMemo, useState } from 'react';

type Props = {
  groups: TournamentGroups;
  participants: Participant[];
  standings: Record<GroupId, GroupStanding[]>;
  theme: ThemeColors;
};

export function GroupsTab({ groups, participants, standings, theme }: Props) {
  const [selected, setSelected] = useState<GroupId | null>(null);
  const ownerByTeam = useMemo(
    () =>
      new Map(
        participants.flatMap((participant) =>
          participant.teams.map((team) => [team, participant.name] as const)
        )
      ),
    [participants]
  );
  const entries = Object.entries(groups).filter(([g]) => !selected || selected === g) as [
    GroupId,
    string[],
  ][];
  const bracketProjection = useMemo(() => buildProjectedKnockoutBracket(standings), [standings]);

  return (
    <div>
      <SectionHeading overline="TABLES" line1="GROUP STAGE" accent={theme.accent} />

      {/* Chips — horizontally scrollable on mobile */}
      <div className="-mx-5 mb-8 overflow-x-auto px-5 md:mx-0 md:mb-10 md:overflow-visible md:px-0">
        <div className="flex w-max justify-center gap-1.5 md:w-auto md:flex-wrap md:gap-2">
          <Chip
            label="ALL"
            active={!selected}
            accent={theme.accent}
            bg={theme.bg}
            onClick={() => setSelected(null)}
          />
          {(Object.keys(groups) as GroupId[]).map((g) => (
            <Chip
              key={g}
              label={g}
              active={selected === g}
              accent={theme.accent}
              bg={theme.bg}
              onClick={() => setSelected(g)}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(340px,1fr))] md:gap-4">
        {entries.map(([group, teams]) => (
          <GroupTable
            key={group}
            group={group}
            teams={teams}
            ownerByTeam={ownerByTeam}
            standings={standings[group]}
            theme={theme}
          />
        ))}
      </div>

      <div className="mt-8 md:mt-10">
        <BestThirdPlaceTable
          rows={bracketProjection.thirdPlaceStandings}
          ownerByTeam={ownerByTeam}
          completedGroups={bracketProjection.completedGroups}
          totalGroups={bracketProjection.totalGroups}
          theme={theme}
        />
      </div>
    </div>
  );
}
