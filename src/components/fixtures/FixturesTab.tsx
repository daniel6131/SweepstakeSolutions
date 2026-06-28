'use client';

import { FixtureCard } from '@/components/fixtures/FixtureCard';
import { FixtureFilterBar } from '@/components/fixtures/FixtureFilterBar';
import { FixtureFilterPanel } from '@/components/fixtures/FixtureFilterPanel';
import { FixturesTodayLead } from '@/components/fixtures/FixturesTodayLead';
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
import { getDayKey, getFixtureDisplayParts, getFixtureSortTimestamp } from '@/lib/match-time';
import { getLenis } from '@/lib/use-smooth-scroll';
import { useLiveClock } from '@/lib/use-live-clock';
import type { Fixture, GroupId, Participant, ThemeColors, TournamentGroups } from '@/types';
import { SearchX } from 'lucide-react';
import type { PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from 'react';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';

type Props = {
  fixtures: Fixture[];
  bracket: ProjectedKnockoutBracket;
  groups: TournamentGroups;
  participants: Participant[];
  theme: ThemeColors;
};

type DayGroup = {
  dayKey: string;
  dateLabel: string;
  fixtures: Fixture[];
  dayGroups: GroupId[];
};

/** Stable DOM id for a day section, keyed off the (filter-independent) day key. */
function dayId(dayKey: string): string {
  return `fixtures-day-${dayKey.replace(/\s+/g, '-')}`;
}

/** Group a fixture list into chronological day buckets. */
function groupByDay(list: Fixture[], timeZone: string | null): DayGroup[] {
  return list
    .slice()
    .sort((a, b) => getFixtureSortTimestamp(a) - getFixtureSortTimestamp(b))
    .reduce<DayGroup[]>((acc, fixture) => {
      const display = getFixtureDisplayParts(fixture, timeZone);
      const current = acc[acc.length - 1];
      if (current && current.dayKey === display.dayKey) {
        current.fixtures.push(fixture);
        if (!current.dayGroups.includes(fixture.group)) {
          current.dayGroups.push(fixture.group);
          current.dayGroups.sort();
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
    }, []);
}

function scrollToFixtureDay(id: string, opts?: { immediate?: boolean; updateHash?: boolean }) {
  const target = document.getElementById(id);
  if (!target) return;

  // Land the day header just below the fixed nav AND the sticky date rail.
  const navHeight = window.innerWidth >= 768 ? 64 : 56;
  const railHeight =
    document.querySelector('[data-fixtures-rail]')?.getBoundingClientRect().height ?? 56;
  const navOffset = navHeight + railHeight + 14;

  if (opts?.updateHash !== false) window.history.replaceState(null, '', `#${id}`);

  // Lenis owns the scroll position — native scrollTo gets reverted next frame.
  const lenis = getLenis();
  if (lenis) {
    // A tab switch changes page height without a window resize, so Lenis can hold
    // a stale (shorter) scroll limit and clamp the jump short. Recompute first.
    lenis.resize();
    lenis.scrollTo(target, { offset: -navOffset, immediate: opts?.immediate });
    return;
  }

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const top = target.getBoundingClientRect().top + window.scrollY - navOffset;
  window.scrollTo({
    top: Math.max(0, top),
    behavior: opts?.immediate || reduce ? 'auto' : 'smooth',
  });
}

/**
 * The live-edge day: the first day with a match still to be decided (status-driven,
 * independent of the viewer's clock). Falls back to the viewer's calendar day when
 * the data carries no status (static data). Returns -1 when there are no days.
 */
function findLiveEdgeIndex(
  days: DayGroup[],
  nowMs: number | null,
  timeZone: string | null
): number {
  if (days.length === 0) return -1;

  const hasStatus = days.some((day) => day.fixtures.some((f) => f.status != null));
  if (hasStatus) {
    const edge = days.findIndex((day) => day.fixtures.some((f) => f.status !== 'finished'));
    return edge === -1 ? days.length - 1 : edge;
  }

  if (nowMs == null) return -1;
  const dayNumber = (ms: number) =>
    Number(
      new Intl.DateTimeFormat('en-CA', {
        timeZone: timeZone ?? undefined,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
        .format(new Date(ms))
        .replace(/-/g, '')
    );
  const today = dayNumber(nowMs);
  const upcoming = days.findIndex(
    (day) => dayNumber(getFixtureSortTimestamp(day.fixtures[0])) >= today
  );
  return upcoming === -1 ? days.length - 1 : upcoming;
}

export function FixturesTab({ fixtures, bracket, groups, participants, theme }: Props) {
  const [view, setView] = useState<'schedule' | 'knockout'>('schedule');
  const [filters, setFilters] = useState<FixtureFilterState>(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [spiedDayKey, setSpiedDayKey] = useState<string>('');
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
  const userScrolledRef = useRef(false);
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

  // The rail is the stable tournament reference frame: ALL days (unfiltered).
  // The feed is the filtered view. A filtered-out day stays in the rail (muted)
  // so positions never shift and the live/today signal is never hidden.
  const allDays = useMemo(() => groupByDay(fixtures, timeZone), [fixtures, timeZone]);
  const groupedFixtures = useMemo(
    () => groupByDay(filteredFixtures, timeZone),
    [filteredFixtures, timeZone]
  );
  const visibleCountByKey = useMemo(
    () => new Map(groupedFixtures.map((day) => [day.dayKey, day.fixtures.length])),
    [groupedFixtures]
  );
  const matchdayByKey = useMemo(
    () => new Map(allDays.map((day, index) => [day.dayKey, index + 1])),
    [allDays]
  );

  const knockoutBracket = useMemo(() => (view === 'knockout' ? bracket : null), [bracket, view]);

  // Tick the clock only while something is live (cheap: one timer, minute-grain).
  const hasLive = useMemo(() => fixtures.some((f) => f.status === 'live'), [fixtures]);
  const nowMs = useLiveClock(hasLive);

  const liveEdgeIndex = useMemo(
    () => findLiveEdgeIndex(allDays, nowMs, timeZone),
    [allDays, nowMs, timeZone]
  );
  const liveEdgeDayKey = liveEdgeIndex >= 0 ? (allDays[liveEdgeIndex]?.dayKey ?? '') : '';

  // The "current day" to surface as a lead block on arrival: the viewer's
  // calendar day if it has matches, else the live edge (next undecided day).
  // Shown only when that day isn't already the first in the list (otherwise it's
  // right there and a lead would just duplicate the top).
  const todayKey = nowMs != null && timeZone ? getDayKey(nowMs, timeZone) : '';
  const todayIndex = todayKey ? allDays.findIndex((day) => day.dayKey === todayKey) : -1;
  const featuredIndex = todayIndex >= 0 ? todayIndex : liveEdgeIndex;
  const featuredDayKey = featuredIndex >= 0 ? (allDays[featuredIndex]?.dayKey ?? '') : '';
  const featuredDay = featuredDayKey
    ? groupedFixtures.find((day) => day.dayKey === featuredDayKey)
    : undefined;
  const featuredIsFirst = groupedFixtures[0]?.dayKey === featuredDayKey;
  const featuredHasLive = featuredDay?.fixtures.some((f) => f.status === 'live') ?? false;
  const showTodayLead = Boolean(featuredDay) && !featuredIsFirst;
  const todayOverline = featuredHasLive ? 'Live now' : todayIndex >= 0 ? 'Today' : 'Up next';

  // Scroll-spy: highlight the day occupying the top third of the viewport, so the
  // rail always shows where you are as you flick through the whole tournament.
  useEffect(() => {
    if (view !== 'schedule' || groupedFixtures.length === 0) return;
    const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-fixtures-day]'));
    if (sections.length === 0) return;

    let raf = 0;
    const compute = () => {
      const line = (window.visualViewport?.height ?? window.innerHeight) * 0.33;
      let activeKey = sections[0].dataset.fixturesDay ?? '';
      for (const section of sections) {
        if (section.getBoundingClientRect().top - line <= 0) {
          activeKey = section.dataset.fixturesDay ?? activeKey;
        } else {
          break;
        }
      }
      setSpiedDayKey((prev) => (prev === activeKey ? prev : activeKey));
    };
    const onScroll = () => {
      userScrolledRef.current = true;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(compute);
    };

    compute();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [view, groupedFixtures]);

  // Center the live-edge chip in the rail on arrival (horizontal rail scroll only,
  // never a page jump). This is the one-tap "where the action is" affordance that
  // replaces the old, disorienting auto-scroll.
  const didCenterRef = useRef(false);
  useEffect(() => {
    if (view !== 'schedule' || didCenterRef.current || !liveEdgeDayKey) return;
    const rail = dateRailRef.current;
    const chip = rail?.querySelector<HTMLElement>(`[data-day-key="${CSS.escape(liveEdgeDayKey)}"]`);
    if (rail && chip) {
      didCenterRef.current = true;
      rail.scrollLeft = chip.offsetLeft - rail.clientWidth / 2 + chip.clientWidth / 2;
    }
  }, [view, liveEdgeDayKey]);

  // Keep the active (spied) chip centered as the user scrolls — but not until they
  // actually scroll (so it doesn't fight the arrival centering above), and never
  // while they're dragging the rail.
  useEffect(() => {
    if (!spiedDayKey || !userScrolledRef.current || dragStateRef.current.active) return;
    const rail = dateRailRef.current;
    const chip = rail?.querySelector<HTMLElement>(`[data-day-key="${CSS.escape(spiedDayKey)}"]`);
    if (!rail || !chip) return;
    const target = chip.offsetLeft - rail.clientWidth / 2 + chip.clientWidth / 2;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    rail.scrollTo({ left: target, behavior: reduce ? 'auto' : 'smooth' });
  }, [spiedDayKey]);

  // Keyboard: ←/→ cycle to the previous/next day (progressive enhancement).
  useEffect(() => {
    if (view !== 'schedule') return;
    const onKey = (event: KeyboardEvent) => {
      if (filtersOpen || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
      const tag = (document.activeElement?.tagName ?? '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      const keys = groupedFixtures.map((day) => day.dayKey);
      const current = keys.indexOf(spiedDayKey);
      if (current === -1) return;
      const next =
        event.key === 'ArrowRight'
          ? Math.min(keys.length - 1, current + 1)
          : Math.max(0, current - 1);
      if (next === current) return;
      event.preventDefault();
      scrollToFixtureDay(dayId(keys[next]));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view, filtersOpen, groupedFixtures, spiedDayKey]);

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
                color: view === key ? theme.bg : `${theme.accent}c2`,
                background: view === key ? theme.accent : 'transparent',
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === 'knockout' ? (
        knockoutBracket ? (
          <KnockoutBracket
            bracket={knockoutBracket}
            ownerByTeam={ownerByTeam}
            theme={theme}
            timeZone={timeZone}
          />
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
              {showTodayLead && featuredDay && (
                <FixturesTodayLead
                  fixtures={featuredDay.fixtures}
                  dateLabel={featuredDay.dateLabel}
                  overline={todayOverline}
                  live={featuredHasLive}
                  ownerByTeam={ownerByTeam}
                  theme={theme}
                  timeZone={timeZone}
                  nowMs={nowMs}
                />
              )}
              <div data-fixtures-rail className="fixtures-rail mb-8 md:mb-10">
                <div
                  ref={dateRailRef}
                  className={`overflow-x-auto rounded-2xl select-none ${
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
                    background: 'color-mix(in srgb, var(--color-bg) 82%, transparent)',
                    border: `1px solid ${theme.accent}1f`,
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    scrollbarWidth: 'none',
                    WebkitOverflowScrolling: 'touch',
                    overscrollBehaviorX: 'contain',
                    overflowY: 'hidden',
                    touchAction: 'pan-x',
                  }}>
                  <div className="flex min-w-full items-center gap-1 px-3 py-2 md:gap-1.5 md:px-4">
                    <span
                      className="font-heading shrink-0 pr-1 text-[9px] font-bold uppercase tracking-[3px] md:text-[10px]"
                      style={{ color: `${theme.accent}45` }}>
                      Jump to
                    </span>
                    {allDays.map(({ dayKey, dateLabel, fixtures: dayFixtures }) => {
                      const isVisible = visibleCountByKey.has(dayKey);
                      const isActive = isVisible && dayKey === spiedDayKey;
                      const dayHasLive = dayFixtures.some((f) => f.status === 'live');
                      const count = visibleCountByKey.get(dayKey);
                      return (
                        <button
                          key={dayKey}
                          type="button"
                          data-day-key={dayKey}
                          aria-current={isActive ? 'date' : undefined}
                          aria-disabled={isVisible ? undefined : true}
                          tabIndex={isVisible ? undefined : -1}
                          onClick={(event) => {
                            if (dragStateRef.current.moved || !isVisible) {
                              event.preventDefault();
                              return;
                            }
                            scrollToFixtureDay(dayId(dayKey));
                          }}
                          className="font-heading inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-2 text-[10px] font-bold uppercase tracking-[1.5px] transition-colors duration-200 md:min-h-0 md:px-3 md:text-[11px]"
                          style={
                            isActive
                              ? { color: theme.bg, background: theme.accent }
                              : isVisible
                                ? { color: `${theme.accent}c2`, background: 'transparent' }
                                : {
                                    color: `${theme.accent}5c`,
                                    background: 'transparent',
                                    cursor: 'default',
                                    pointerEvents: 'none',
                                  }
                          }>
                          {dayHasLive && (
                            <span
                              className="inline-flex h-1.5 w-1.5 shrink-0 rounded-full"
                              style={{
                                background: isActive ? theme.bg : theme.accent,
                                animation: 'live-dot 1.6s ease-in-out infinite',
                              }}
                            />
                          )}
                          <span>{dateLabel}</span>
                          {isVisible && count != null && (
                            <span
                              style={{ color: isActive ? `${theme.bg}cc` : `${theme.accent}b3` }}>
                              · {count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-8 md:space-y-10">
                {groupedFixtures.map(({ dayKey, dateLabel, fixtures: dayFixtures, dayGroups }) => (
                  <section
                    key={dayKey}
                    id={dayId(dayKey)}
                    data-fixtures-day={dayKey}
                    className="scroll-mt-[132px] overflow-hidden rounded-[28px] p-4 md:scroll-mt-[150px] md:p-6"
                    style={{
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
                          Matchday {matchdayByKey.get(dayKey) ?? 1}
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
                          nowMs={nowMs}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
