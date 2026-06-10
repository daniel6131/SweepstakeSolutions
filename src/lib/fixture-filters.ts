import type { Fixture, GroupId, Participant } from '@/types';

/**
 * Faceted filtering for the group-stage schedule.
 *
 * Three independent facets — owners ("people"), groups, and teams — combine with
 * AND across facets and OR within a facet (standard faceted search). The
 * `headToHead` modifier narrows the people facet to fixtures where BOTH sides are
 * owned by two *different* selected players — i.e. the sweepstake rivalries.
 */
export type FixtureFilterState = {
  people: string[];
  groups: GroupId[];
  teams: string[];
  headToHead: boolean;
};

export const EMPTY_FILTERS: FixtureFilterState = {
  people: [],
  groups: [],
  teams: [],
  headToHead: false,
};

export type FixtureFilterOptions = {
  people: string[];
  groups: GroupId[];
  teams: string[];
};

/** Number of selected facet values (drives the "Filters (n)" badge). */
export function countActiveFilters(filters: FixtureFilterState): number {
  return filters.people.length + filters.groups.length + filters.teams.length;
}

export function hasActiveFilters(filters: FixtureFilterState): boolean {
  return countActiveFilters(filters) > 0;
}

/** Derive the available filter values from the live/static fixture set. */
export function buildFilterOptions(
  fixtures: Fixture[],
  participants: Participant[]
): FixtureFilterOptions {
  const groups = Array.from(new Set(fixtures.map((f) => f.group))).sort() as GroupId[];
  const teams = Array.from(new Set(fixtures.flatMap((f) => [f.t1, f.t2]))).sort((a, b) =>
    a.localeCompare(b)
  );
  const people = participants.map((p) => p.name);
  return { people, groups, teams };
}

export function filterFixtures(
  fixtures: Fixture[],
  filters: FixtureFilterState,
  ownerByTeam: Map<string, string>
): Fixture[] {
  const peopleSet = new Set(filters.people);
  const groupSet = new Set(filters.groups);
  const teamSet = new Set(filters.teams);

  return fixtures.filter((f) => {
    if (groupSet.size > 0 && !groupSet.has(f.group)) return false;

    if (teamSet.size > 0 && !teamSet.has(f.t1) && !teamSet.has(f.t2)) return false;

    if (peopleSet.size > 0) {
      const owner1 = ownerByTeam.get(f.t1);
      const owner2 = ownerByTeam.get(f.t2);

      if (filters.headToHead) {
        const isClash =
          owner1 != null &&
          owner2 != null &&
          owner1 !== owner2 &&
          peopleSet.has(owner1) &&
          peopleSet.has(owner2);
        if (!isClash) return false;
      } else {
        const involved =
          (owner1 != null && peopleSet.has(owner1)) || (owner2 != null && peopleSet.has(owner2));
        if (!involved) return false;
      }
    }

    return true;
  });
}
