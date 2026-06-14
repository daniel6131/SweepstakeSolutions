'use client';

import { Flag } from '@/components/ui/Flag';
import {
  countActiveFilters,
  hasActiveFilters,
  type FixtureFilterOptions,
  type FixtureFilterState,
} from '@/lib/fixture-filters';
import type { GroupId, ThemeColors } from '@/types';
import { Check, Swords, X } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  filters: FixtureFilterState;
  options: FixtureFilterOptions;
  onChange: (next: FixtureFilterState) => void;
  onClear: () => void;
  ownerByTeam: Map<string, string>;
  resultCount: number;
  theme: ThemeColors;
};

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function FixtureFilterPanel({
  open,
  onClose,
  filters,
  options,
  onChange,
  onClear,
  ownerByTeam,
  resultCount,
  theme,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  const handleBackdropClick = useCallback(
    (event: React.MouseEvent<HTMLDialogElement>) => {
      if (event.target === dialogRef.current) onClose();
    },
    [onClose]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDialogElement>) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    },
    [onClose]
  );

  const active = hasActiveFilters(filters);
  const count = countActiveFilters(filters);
  const canHeadToHead = filters.people.length >= 2;

  const setPeople = (name: string) =>
    onChange({ ...filters, people: toggle(filters.people, name) });
  const setGroup = (group: GroupId) =>
    onChange({ ...filters, groups: toggle(filters.groups, group) });
  const setTeam = (team: string) => onChange({ ...filters, teams: toggle(filters.teams, team) });

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      aria-label="Filter fixtures"
      // Mobile uses a *definite* height (h-[86svh]), not max-h: iOS Safari won't
      // resolve a flex-1 child's height in a column flex container that only has
      // max-height, so the scrollable middle collapsed to 0 and only the header +
      // footer showed. Desktop overrides back to fit-content via md:h-fit.
      className="filter-panel fixed inset-x-2 bottom-2 top-auto m-0 h-[86svh] w-[calc(100%-1rem)] max-w-none overflow-hidden rounded-[24px] border-0 p-0 text-white md:inset-x-auto md:top-0 md:bottom-0 md:left-6 md:my-auto md:h-fit md:max-h-[86svh] md:w-[408px]"
      style={{
        background: `${theme.bg}f7`,
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        border: `1px solid ${theme.accent}1f`,
        boxShadow: 'var(--card-highlight), var(--shadow-lg)',
      }}>
      {/* Header */}
      <header
        className="flex shrink-0 items-center justify-between gap-4 px-4 py-3.5 md:px-5"
        style={{ borderBottom: `1px solid ${theme.accent}14` }}>
        <div className="flex items-baseline gap-2.5">
          <h2
            className="font-display text-[22px] leading-none tracking-[-0.02em] md:text-[26px]"
            style={{ color: theme.accent }}>
            FILTERS
          </h2>
          {count > 0 ? (
            <span
              className="font-heading text-[11px] font-bold tracking-[1px] tabular-nums"
              style={{ color: `${theme.accent}66` }}>
              ({count})
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          {active ? (
            <button
              type="button"
              onClick={onClear}
              className="font-heading cursor-pointer text-[11px] font-bold uppercase tracking-[1.5px] underline underline-offset-4 transition-opacity hover:opacity-70"
              style={{ color: `${theme.accent}99` }}>
              Clear
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-colors"
            style={{ background: `${theme.accent}12`, color: `${theme.accent}cc` }}>
            <X size={16} />
          </button>
        </div>
      </header>

      {/* Stacked frosted facet cards — the schedule shows through behind them */}
      <div
        className="min-h-0 flex-1 overflow-y-auto"
        data-lenis-prevent
        style={{
          scrollbarWidth: 'none',
          maskImage:
            'linear-gradient(to bottom, transparent, #000 10px, #000 calc(100% - 10px), transparent)',
        }}>
        <div className="flex flex-col gap-2 p-3">
          {/* People */}
          <Section title="People" hint="Fixtures involving their teams" theme={theme}>
            <div className="flex flex-wrap gap-2">
              {options.people.map((name) => (
                <FacetChip
                  key={name}
                  label={name}
                  active={filters.people.includes(name)}
                  theme={theme}
                  onClick={() => setPeople(name)}
                />
              ))}
            </div>
            <button
              type="button"
              disabled={!canHeadToHead}
              onClick={() => onChange({ ...filters, headToHead: !filters.headToHead })}
              className="font-heading mt-3 inline-flex cursor-pointer items-center gap-2 rounded-full px-3.5 py-2 text-[11px] font-bold uppercase tracking-[1.5px] transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-35"
              style={{
                border: `1.5px solid ${filters.headToHead && canHeadToHead ? theme.accent : `${theme.accent}1f`}`,
                background:
                  filters.headToHead && canHeadToHead ? theme.accent : `${theme.accent}0a`,
                color: filters.headToHead && canHeadToHead ? theme.bg : `${theme.accent}99`,
              }}>
              <Swords size={13} />
              Head-to-head only
            </button>
            {!canHeadToHead ? (
              <p
                className="mt-2 text-[10px] tracking-[0.5px]"
                style={{ color: `${theme.accent}55` }}>
                Pick 2+ people to isolate their direct clashes.
              </p>
            ) : null}
          </Section>

          {/* Groups */}
          <Section title="Group" theme={theme}>
            <div className="flex flex-wrap gap-2">
              {options.groups.map((group) => (
                <FacetChip
                  key={group}
                  label={`Group ${group}`}
                  active={filters.groups.includes(group)}
                  theme={theme}
                  onClick={() => setGroup(group)}
                />
              ))}
            </div>
          </Section>

          {/* Teams */}
          <Section title="Teams" hint={`${options.teams.length} nations`} theme={theme}>
            <div
              className="-mx-1 max-h-52 overflow-y-auto px-1"
              data-lenis-prevent
              style={{ scrollbarWidth: 'none' }}>
              <div className="flex flex-wrap gap-2">
                {options.teams.map((team) => (
                  <TeamChip
                    key={team}
                    team={team}
                    owner={ownerByTeam.get(team)}
                    active={filters.teams.includes(team)}
                    theme={theme}
                    onClick={() => setTeam(team)}
                  />
                ))}
              </div>
            </div>
          </Section>
        </div>
      </div>

      {/* Footer */}
      <footer
        className="shrink-0 p-3 md:p-3.5"
        style={{ borderTop: `1px solid ${theme.accent}14` }}>
        <button
          type="button"
          onClick={onClose}
          className="font-display w-full cursor-pointer rounded-xl py-3 text-[14px] tracking-[0.5px] transition-transform duration-200 hover:scale-[1.01]"
          style={{ background: theme.accent, color: theme.bg }}>
          {resultCount > 0
            ? `Show ${resultCount} ${resultCount === 1 ? 'match' : 'matches'}`
            : 'No matches. Adjust filters'}
        </button>
      </footer>
    </dialog>
  );
}

function Section({
  title,
  hint,
  theme,
  children,
}: {
  title: string;
  hint?: string;
  theme: ThemeColors;
  children: React.ReactNode;
}) {
  return (
    <section
      className="relative overflow-hidden rounded-[16px] px-4 py-4 md:px-5"
      style={{
        background: `${theme.accent}0a`,
        border: `1px solid ${theme.accent}14`,
        boxShadow: 'var(--card-highlight)',
      }}>
      <div className="mb-3 flex items-baseline gap-2.5">
        <h3 className="font-heading text-[12px] font-bold uppercase tracking-[2.5px] text-white/85">
          {title}
        </h3>
        {hint ? <span className="text-[10px] tracking-[0.5px] text-white/30">{hint}</span> : null}
      </div>
      {children}
    </section>
  );
}

function FacetChip({
  label,
  active,
  theme,
  onClick,
}: {
  label: string;
  active: boolean;
  theme: ThemeColors;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="font-heading inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-semibold tracking-[0.3px] transition-all duration-300"
      style={{
        border: `1.5px solid ${active ? theme.accent : `${theme.accent}1f`}`,
        background: active ? theme.accent : `${theme.accent}0d`,
        color: active ? theme.bg : 'rgba(255,255,255,0.7)',
      }}>
      {active ? <Check size={13} /> : null}
      {label}
    </button>
  );
}

function TeamChip({
  team,
  owner,
  active,
  theme,
  onClick,
}: {
  team: string;
  owner: string | undefined;
  active: boolean;
  theme: ThemeColors;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={owner ? `${team} · ${owner}` : team}
      className="inline-flex cursor-pointer items-center gap-2 rounded-full py-1.5 pr-3.5 pl-1.5 text-[12px] font-semibold transition-all duration-300"
      style={{
        border: `1.5px solid ${active ? theme.accent : `${theme.accent}1f`}`,
        background: active ? theme.accent : `${theme.accent}0d`,
        color: active ? theme.bg : 'rgba(255,255,255,0.7)',
      }}>
      <Flag team={team} size={20} />
      {team}
    </button>
  );
}
