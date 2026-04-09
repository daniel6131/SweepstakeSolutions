import { Flag } from '@/components/ui/Flag';
import { getAllTeams } from '@/data/groups';
import type { ThemeColors, TournamentGroups } from '@/types';

export function NationMarquee({ groups, theme }: { groups: TournamentGroups; theme: ThemeColors }) {
  const allTeams = getAllTeams(groups);
  return (
    <div
      className="mb-8 overflow-hidden py-3 md:mb-10 md:py-4"
      style={{
        borderTop: `1px solid ${theme.accent}10`,
        borderBottom: `1px solid ${theme.accent}10`,
      }}
      data-reveal>
      <div className="animate-marquee flex w-fit gap-6 whitespace-nowrap md:gap-10">
        {[0, 1].flatMap((rep) =>
          allTeams.map((t, i) => (
            <span
              key={`${rep}-${i}`}
              className="font-heading inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[2px] md:text-xs"
              style={{ color: `${theme.accent}35` }}>
              <Flag team={t} size={16} />
              {t}
            </span>
          ))
        )}
      </div>
    </div>
  );
}
