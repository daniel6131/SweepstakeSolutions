'use client';

import { FixtureCard } from '@/components/fixtures/FixtureCard';
import { KnockoutBracket } from '@/components/fixtures/KnockoutBracket';
import { NationMarquee } from '@/components/fixtures/NationMarquee';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { buildProjectedKnockoutBracket } from '@/lib/knockout';
import type {
  Fixture,
  GroupId,
  GroupStanding,
  Participant,
  ThemeColors,
  TournamentGroups,
} from '@/types';
import { useState } from 'react';

type Props = {
  fixtures: Fixture[];
  groups: TournamentGroups;
  participants: Participant[];
  standings: Record<GroupId, GroupStanding[]>;
  theme: ThemeColors;
};

const MONTH_INDEX: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

function fixtureTimestamp(fixture: Fixture): number {
  const [month, day] = fixture.date.split(' ');
  const [hours, minutes] = fixture.time.split(':').map(Number);
  return new Date(2026, MONTH_INDEX[month] ?? 0, Number(day), hours, minutes).getTime();
}

function scrollToFixtureDay(id: string) {
  const target = document.getElementById(id);
  if (!target) return;

  const navOffset = window.innerWidth >= 768 ? 96 : 84;
  const top = target.getBoundingClientRect().top + window.scrollY - navOffset;

  window.history.replaceState(null, '', `#${id}`);
  window.scrollTo({
    top: Math.max(0, top),
    behavior: 'smooth',
  });
}

export function FixturesTab({ fixtures, groups, participants, standings, theme }: Props) {
  const [view, setView] = useState<'schedule' | 'knockout'>('schedule');
  const groupedFixtures = fixtures
    .slice()
    .sort((a, b) => fixtureTimestamp(a) - fixtureTimestamp(b))
    .reduce<
      Array<{
        date: string;
        fixtures: Fixture[];
      }>
    >((acc, fixture) => {
      const currentGroup = acc[acc.length - 1];
      if (currentGroup && currentGroup.date === fixture.date) {
        currentGroup.fixtures.push(fixture);
        return acc;
      }

      acc.push({ date: fixture.date, fixtures: [fixture] });
      return acc;
    }, []);
  const ownerByTeam = new Map(
    participants.flatMap((participant) =>
      participant.teams.map((team) => [team, participant.name] as const)
    )
  );
  const bracket = buildProjectedKnockoutBracket(standings);

  return (
    <div>
      <SectionHeading
        overline="SCHEDULE"
        line1="FIXTURES"
        line2="& RESULTS"
        accent={theme.accent}
      />
      <NationMarquee groups={groups} theme={theme} />
      <div className="mb-8 flex justify-center md:mb-10" data-reveal>
        <div
          className="inline-flex items-center gap-1 rounded-full p-1.5"
          style={{
            background: `${theme.accent}06`,
            border: `1px solid ${theme.accent}10`,
          }}>
          {(
            [
              ['schedule', 'Group Stage'],
              ['knockout', 'Knockout'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setView(key)}
              aria-pressed={view === key}
              className="font-heading cursor-pointer rounded-full px-3 py-2 text-[10px] font-bold uppercase tracking-[2px] transition-colors duration-300 md:px-4 md:text-[11px]"
              style={{
                color: view === key ? theme.bg : `${theme.accent}75`,
                background: view === key ? theme.accent : 'transparent',
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === 'knockout' ? (
        <KnockoutBracket bracket={bracket} ownerByTeam={ownerByTeam} theme={theme} />
      ) : (
        <>
          <div
            className="mb-8 overflow-x-auto pb-2 md:mb-10"
            style={{ scrollbarWidth: 'none' }}
            data-reveal>
            <div
              className="mx-auto flex w-max min-w-full items-center justify-center gap-2 rounded-full px-3 py-2 md:gap-3 md:px-4"
              style={{
                background: `${theme.accent}06`,
                border: `1px solid ${theme.accent}10`,
              }}>
              <span
                className="font-heading shrink-0 text-[9px] font-bold uppercase tracking-[3px] md:text-[10px]"
                style={{ color: `${theme.accent}45` }}>
                Jump to
              </span>
              {groupedFixtures.map(({ date, fixtures }, index) => (
                <button
                  key={date}
                  type="button"
                  onClick={() => scrollToFixtureDay(`fixtures-day-${index + 1}`)}
                  className="font-heading shrink-0 cursor-pointer rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[2px] transition-colors duration-300 md:px-2.5 md:text-[11px]"
                  style={{
                    color: `${theme.accent}78`,
                    background: 'transparent',
                  }}>
                  {date}
                  <span style={{ color: `${theme.accent}45` }}> · {fixtures.length}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-8 md:space-y-10">
            {groupedFixtures.map(({ date, fixtures: dayFixtures }, index) => {
              const dayGroups = [...new Set(dayFixtures.map((fixture) => fixture.group))].sort();

              return (
                <section
                  key={date}
                  id={`fixtures-day-${index + 1}`}
                  className="overflow-hidden rounded-[28px] p-4 md:p-6"
                  style={{
                    scrollMarginTop: '92px',
                    background: `linear-gradient(180deg, ${theme.card}f2 0%, ${theme.card}cc 100%)`,
                    border: `1px solid ${theme.accent}12`,
                    boxShadow: `0 24px 80px ${theme.bg}35`,
                  }}
                  data-reveal>
                  <div
                    className="mb-5 flex flex-col gap-4 border-b pb-4 md:mb-6 md:flex-row md:items-end md:justify-between md:pb-5"
                    style={{ borderColor: `${theme.accent}10` }}>
                    <div>
                      <div
                        className="font-heading mb-2 text-[10px] font-bold uppercase tracking-[3px] md:text-[11px]"
                        style={{ color: `${theme.accent}50` }}>
                        Matchday {index + 1}
                      </div>
                      <h3
                        className="font-display text-[28px] leading-none tracking-[-0.03em] md:text-[40px]"
                        style={{ color: theme.accent }}>
                        {date}
                      </h3>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <div
                        className="font-heading rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[2px]"
                        style={{
                          color: theme.bg,
                          background: theme.accent,
                        }}>
                        {dayFixtures.length} matches
                      </div>
                      <div
                        className="font-heading rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[2px]"
                        style={{
                          color: `${theme.accent}78`,
                          background: `${theme.accent}08`,
                          border: `1px solid ${theme.accent}14`,
                        }}>
                        Groups {dayGroups.join(' · ')}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(320px,1fr))] md:gap-4">
                    {dayFixtures.map((fixture) => (
                      <FixtureCard
                        key={`${fixture.date}-${fixture.t1}-${fixture.t2}`}
                        fixture={fixture}
                        theme={theme}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
