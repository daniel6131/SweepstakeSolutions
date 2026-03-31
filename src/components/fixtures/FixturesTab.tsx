import { FixtureCard } from '@/components/fixtures/FixtureCard';
import { NationMarquee } from '@/components/fixtures/NationMarquee';
import { SectionHeading } from '@/components/ui/SectionHeading';
import type { Fixture, ThemeColors } from '@/types';

type Props = { fixtures: Fixture[]; theme: ThemeColors };

export function FixturesTab({ fixtures, theme }: Props) {
  return (
    <div>
      <SectionHeading
        overline="SCHEDULE"
        line1="FIXTURES"
        line2="& RESULTS"
        accent={theme.accent}
      />
      <NationMarquee theme={theme} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(320px,1fr))] md:gap-4">
        {fixtures.map((f) => (
          <FixtureCard key={`${f.t1}-${f.t2}`} fixture={f} theme={theme} />
        ))}
      </div>
    </div>
  );
}
