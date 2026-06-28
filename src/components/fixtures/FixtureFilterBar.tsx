'use client';

import { type FixtureFilterState } from '@/lib/fixture-filters';
import type { GroupId, ThemeColors } from '@/types';
import { ListFilter, X } from 'lucide-react';

type ActiveChip = { key: string; label: string; remove: () => void };

type Props = {
  filters: FixtureFilterState;
  activeCount: number;
  resultCount: number;
  totalCount: number;
  theme: ThemeColors;
  onOpen: () => void;
  onClear: () => void;
  onChange: (next: FixtureFilterState) => void;
};

export function FixtureFilterBar({
  filters,
  activeCount,
  resultCount,
  totalCount,
  theme,
  onOpen,
  onClear,
  onChange,
}: Props) {
  const chips: ActiveChip[] = [
    ...filters.people.map((name) => ({
      key: `p-${name}`,
      label: name,
      remove: () => onChange({ ...filters, people: filters.people.filter((v) => v !== name) }),
    })),
    ...filters.groups.map((group) => ({
      key: `g-${group}`,
      label: `Group ${group}`,
      remove: () =>
        onChange({ ...filters, groups: filters.groups.filter((v) => v !== group) as GroupId[] }),
    })),
    ...filters.teams.map((team) => ({
      key: `t-${team}`,
      label: team,
      remove: () => onChange({ ...filters, teams: filters.teams.filter((v) => v !== team) }),
    })),
  ];

  return (
    <div className="mb-6 flex flex-col gap-3 md:mb-8" data-reveal>
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onOpen}
          className="font-heading inline-flex cursor-pointer items-center gap-2.5 rounded-full px-4 py-2.5 text-[11px] font-bold uppercase tracking-[2px] transition-all duration-300 md:px-5 md:text-xs"
          style={{
            border: `1.5px solid ${activeCount > 0 ? theme.accent : `${theme.accent}1f`}`,
            background: activeCount > 0 ? theme.accent : `${theme.accent}08`,
            color: activeCount > 0 ? theme.bg : `${theme.accent}cc`,
          }}>
          <ListFilter size={15} />
          Filters
          {activeCount > 0 ? (
            <span
              className="inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] tabular-nums"
              style={{ background: theme.bg, color: theme.accent }}>
              {activeCount}
            </span>
          ) : null}
        </button>

        <span
          className="font-heading text-[11px] font-bold uppercase tracking-[2px] tabular-nums md:text-xs"
          style={{ color: `${theme.accent}c2` }}>
          {activeCount > 0 ? (
            <>
              <span style={{ color: theme.accent }}>{resultCount}</span> / {totalCount} matches
            </>
          ) : (
            <>{totalCount} matches</>
          )}
        </span>
      </div>

      {chips.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={chip.remove}
              className="font-heading group inline-flex cursor-pointer items-center gap-1.5 rounded-full py-1.5 pr-2 pl-3 text-[11px] font-semibold tracking-[0.3px] transition-all duration-300"
              style={{
                border: `1px solid ${theme.accent}2a`,
                background: `${theme.accent}12`,
                color: `${theme.accent}dd`,
              }}>
              {chip.label}
              <span
                className="flex h-4 w-4 items-center justify-center rounded-full transition-colors group-hover:bg-white/10"
                aria-label={`Remove ${chip.label} filter`}>
                <X size={11} />
              </span>
            </button>
          ))}
          {filters.headToHead && filters.people.length >= 2 ? (
            <span
              className="font-heading inline-flex items-center rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[1.5px]"
              style={{ background: theme.accent, color: theme.bg }}>
              Head-to-head
            </span>
          ) : null}
          <button
            type="button"
            onClick={onClear}
            className="font-heading cursor-pointer px-2 text-[10px] font-bold uppercase tracking-[1.5px] underline underline-offset-4 transition-opacity hover:opacity-70"
            style={{ color: `${theme.accent}c2` }}>
            Clear
          </button>
        </div>
      ) : null}
    </div>
  );
}
