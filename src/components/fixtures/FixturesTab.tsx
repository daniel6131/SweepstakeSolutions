import { FixtureCard } from '@/components/fixtures/FixtureCard';
import { NationMarquee } from '@/components/fixtures/NationMarquee';
import { SectionHeading } from '@/components/ui/SectionHeading';
import type { Fixture, ThemeColors, TournamentGroups } from '@/types';

type Props = { fixtures: Fixture[]; groups: TournamentGroups; theme: ThemeColors };

export function FixturesTab({ fixtures, groups, theme }: Props) {
  return (
    <div>
      <SectionHeading
        overline="SCHEDULE"
        line1="FIXTURES"
        line2="& RESULTS"
        accent={theme.accent}
      />
      <NationMarquee groups={groups} theme={theme} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(320px,1fr))] md:gap-4">
        {fixtures.map((f) => (
          <FixtureCard key={`${f.t1}-${f.t2}`} fixture={f} theme={theme} />
        ))}
      </div>
    </div>
  );
}
