'use client';

import { FixtureCard } from '@/components/fixtures/FixtureCard';
import { FixtureFilterBar } from '@/components/fixtures/FixtureFilterBar';
import { FixtureFilterPanel } from '@/components/fixtures/FixtureFilterPanel';
import { KnockoutBracket } from '@/components/fixtures/KnockoutBracket';
import { NationMarquee } from '@/components/fixtures/NationMarquee';
import { SectionHeading } from '@/components/ui/SectionHeading';
import {
  buildFilterOptions,
  countActiveFilters,
  EMPTY_FILTERS,
  filterFixtures,
  type FixtureFilterState,
} from '@/lib/fixture-filters';
import type { ProjectedKnockoutBracket } from '@/lib/knockout';
import { getFixtureDisplayParts, getFixtureSortTimestamp } from '@/lib/match-time';
import { getLenis } from '@/lib/use-smooth-scroll';
import type { Fixture, GroupId, Participant, ThemeColors, TournamentGroups } from '@/types';
import { SearchX } from 'lucide-react';
import type { PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from 'react';
import { useMemo, useRef, useState, useSyncExternalStore } from 'react';

type Props = {
  fixtures: Fixture[];
  bracket: ProjectedKnockoutBracket;
  groups: TournamentGroups;
  participants: Participant[];
  theme: ThemeColors;
};

function scrollToFixtureDay(id: string) {
  const target = document.getElementById(id);
  if (!target) return;

  const navOffset = window.innerWidth >= 768 ? 96 : 84;
  window.history.replaceState(null, '', `#${id}`);

  // Lenis owns the scroll position — native scrollTo gets reverted next frame.
  const lenis = getLenis();
  if (lenis) {
    lenis.scrollTo(target, { offset: -navOffset });
    return;
  }

  const top = target.getBoundingClientRect().top + window.scrollY - navOffset;
  window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
}

export function FixturesTab({ fixtures, bracket, groups, participants, theme }: Props) {
  const [view, setView] = useState<'schedule' | 'knockout'>('schedule');
  const [filters, setFilters] = useState<FixtureFilterState>(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const dateRailRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef({
    active: false,
    startX: 0,
    startScrollLeft: 0,
    moved: false,
    pointerId: -1,
    captured: false,
  });
  const [dateRailDragging, setDateRailDragging] = useState(false);
  const timeZone = useSyncExternalStore(
    () => () => undefined,
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    () => null
  );

  const ownerByTeam = useMemo(() => {
    const lookup = new Map<string, string>();

    for (const participant of participants) {
      for (const team of participant.teams) {
        lookup.set(team, participant.name);
      }
    }

    return lookup;
  }, [participants]);
  const filterOptions = useMemo(
    () => buildFilterOptions(fixtures, participants),
    [fixtures, participants]
  );
  const filteredFixtures = useMemo(
    () => filterFixtures(fixtures, filters, ownerByTeam),
    [fixtures, filters, ownerByTeam]
  );
  const activeFilterCount = countActiveFilters(filters);

  const groupedFixtures = useMemo(
    () =>
      filteredFixtures
        .slice()
        .sort((a, b) => getFixtureSortTimestamp(a) - getFixtureSortTimestamp(b))
        .reduce<
          Array<{
            dayKey: string;
            dateLabel: string;
            fixtures: Fixture[];
            dayGroups: GroupId[];
          }>
        >((acc, fixture) => {
          const display = getFixtureDisplayParts(fixture, timeZone);
          const currentGroup = acc[acc.length - 1];
          if (currentGroup && currentGroup.dayKey === display.dayKey) {
            currentGroup.fixtures.push(fixture);
            if (!currentGroup.dayGroups.includes(fixture.group)) {
              currentGroup.dayGroups.push(fixture.group);
              currentGroup.dayGroups.sort();
            }
            return acc;
          }

          acc.push({
            dayKey: display.dayKey,
            dateLabel: display.dateLabel,
            fixtures: [fixture],
            dayGroups: [fixture.group],
          });
          return acc;
        }, []),
    [filteredFixtures, timeZone]
  );
  const knockoutBracket = useMemo(() => (view === 'knockout' ? bracket : null), [bracket, view]);

  function handleDateRailPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const rail = dateRailRef.current;
    if (!rail) return;

    // Do NOT capture the pointer here — capturing on pointerdown swallows the
    // button's click event. We only capture once an actual drag begins.
    dragStateRef.current = {
      active: true,
      startX: event.clientX,
      startScrollLeft: rail.scrollLeft,
      moved: false,
      pointerId: event.pointerId,
      captured: false,
    };
  }

  function handleDateRailPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const rail = dateRailRef.current;
    const drag = dragStateRef.current;
    if (!rail || !drag.active) return;

    const deltaX = event.clientX - drag.startX;
    if (!drag.moved && Math.abs(deltaX) > 6) {
      drag.moved = true;
      setDateRailDragging(true);
      try {
        event.currentTarget.setPointerCapture(drag.pointerId);
        drag.captured = true;
      } catch {
        // setPointerCapture can throw if the pointer is no longer active
      }
    }

    if (drag.moved) {
      rail.scrollLeft = drag.startScrollLeft - deltaX;
      event.preventDefault();
    }
  }

  function handleDateRailPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragStateRef.current;
    drag.active = false;
    if (drag.captured) {
      try {
        event.currentTarget.releasePointerCapture(drag.pointerId);
      } catch {
        // releasing an inactive pointer throws; safe to ignore
      }
      drag.captured = false;
    }
    setDateRailDragging(false);
    // Reset moved after the click event fires so a drag doesn't trigger a jump.
    window.setTimeout(() => {
      dragStateRef.current.moved = false;
    }, 0);
  }

  function handleDateRailWheel(event: ReactWheelEvent<HTMLDivElement>) {
    const rail = dateRailRef.current;
    if (!rail || rail.scrollWidth <= rail.clientWidth) return;

    if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
      rail.scrollLeft += event.deltaY;
      event.preventDefault();
    }
  }

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
          role="tablist"
          aria-label="Fixtures view"
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
              role="tab"
              onClick={() => setView(key)}
              aria-selected={view === key}
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
        knockoutBracket ? (
          <KnockoutBracket bracket={knockoutBracket} ownerByTeam={ownerByTeam} theme={theme} />
        ) : null
      ) : (
        <>
          <FixtureFilterBar
            filters={filters}
            activeCount={activeFilterCount}
            resultCount={filteredFixtures.length}
            totalCount={fixtures.length}
            theme={theme}
            onOpen={() => setFiltersOpen(true)}
            onClear={() => setFilters(EMPTY_FILTERS)}
            onChange={setFilters}
          />
          <FixtureFilterPanel
            open={filtersOpen}
            onClose={() => setFiltersOpen(false)}
            filters={filters}
            options={filterOptions}
            onChange={setFilters}
            onClear={() => setFilters(EMPTY_FILTERS)}
            ownerByTeam={ownerByTeam}
            resultCount={filteredFixtures.length}
            theme={theme}
          />

          {groupedFixtures.length === 0 ? (
            <div
              className="surface-card flex flex-col items-center gap-4 rounded-[28px] px-6 py-16 text-center md:py-20"
              data-reveal>
              <SearchX size={40} style={{ color: `${theme.accent}66` }} />
              <h3
                className="font-display text-[26px] leading-none tracking-[-0.02em] md:text-[34px]"
                style={{ color: theme.accent }}>
                NO MATCHES
              </h3>
              <p className="max-w-xs text-[13px] leading-relaxed text-white/45">
                Nothing fits this combination of filters. Loosen them to bring fixtures back.
              </p>
              <button
                type="button"
                onClick={() => setFilters(EMPTY_FILTERS)}
                className="font-heading mt-1 cursor-pointer rounded-full px-5 py-2.5 text-[11px] font-bold uppercase tracking-[2px] transition-transform duration-200 hover:scale-[1.02]"
                style={{ background: theme.accent, color: theme.bg }}>
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <div className="mb-8 md:mb-10" data-reveal>
                <div
                  ref={dateRailRef}
                  className={`overflow-x-auto rounded-full select-none ${
                    dateRailDragging ? 'cursor-grabbing' : 'cursor-grab'
                  }`}
                  data-lenis-prevent
                  data-lenis-prevent-touch
                  data-lenis-prevent-wheel
                  onPointerDown={handleDateRailPointerDown}
                  onPointerMove={handleDateRailPointerMove}
                  onPointerUp={handleDateRailPointerUp}
                  onPointerCancel={handleDateRailPointerUp}
                  onWheel={handleDateRailWheel}
                  style={{
                    background: `${theme.accent}06`,
                    border: `1px solid ${theme.accent}10`,
                    scrollbarWidth: 'none',
                    WebkitOverflowScrolling: 'touch',
                    overscrollBehaviorX: 'contain',
                    overflowY: 'hidden',
                    touchAction: 'pan-x',
                  }}>
                  <div className="flex min-w-full items-center justify-between gap-1 px-3 py-2 md:gap-1.5 md:px-4">
                    <span
                      className="font-heading shrink-0 pr-1 text-[9px] font-bold uppercase tracking-[3px] md:text-[10px]"
                      style={{ color: `${theme.accent}45` }}>
                      Jump to
                    </span>
                    {groupedFixtures.map(({ dateLabel, fixtures }, index) => (
                      <button
                        key={`${dateLabel}-${index}`}
                        type="button"
                        onClick={(event) => {
                          if (dragStateRef.current.moved) {
                            event.preventDefault();
                            return;
                          }
                          scrollToFixtureDay(`fixtures-day-${index + 1}`);
                        }}
                        className="font-heading shrink-0 cursor-pointer rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[1.5px] transition-colors duration-200 md:px-2.5 md:text-[11px]"
                        style={{ color: `${theme.accent}78`, background: 'transparent' }}>
                        {dateLabel}
                        <span style={{ color: `${theme.accent}45` }}> · {fixtures.length}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-8 md:space-y-10">
                {groupedFixtures.map(
                  ({ dayKey, dateLabel, fixtures: dayFixtures, dayGroups }, index) => {
                    return (
                      <section
                        key={dayKey}
                        id={`fixtures-day-${index + 1}`}
                        className="overflow-hidden rounded-[28px] p-4 md:p-6"
                        style={{
                          scrollMarginTop: '92px',
                          background: `linear-gradient(180deg, ${theme.card}f2 0%, ${theme.card}cc 100%)`,
                          border: '1px solid var(--card-border)',
                          boxShadow: 'var(--card-highlight), var(--shadow-card-lg)',
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
                              {dateLabel}
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
                              key={`${fixture.utcDate ?? fixture.date}-${fixture.t1}-${fixture.t2}`}
                              fixture={fixture}
                              ownerByTeam={ownerByTeam}
                              theme={theme}
                              timeZone={timeZone}
                            />
                          ))}
                        </div>
                      </section>
                    );
                  }
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
