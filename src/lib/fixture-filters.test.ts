import {
  buildFilterOptions,
  countActiveFilters,
  EMPTY_FILTERS,
  filterFixtures,
  hasActiveFilters,
  type FixtureFilterState,
} from './fixture-filters';
import type { Fixture, Participant } from '@/types';

function makeFixture(group: Fixture['group'], t1: string, t2: string): Fixture {
  return { group, t1, t2, date: '', time: '', venue: '', s1: null, s2: null };
}

const participants: Participant[] = [
  { name: 'Alice', teams: ['Brazil', 'France'] },
  { name: 'Bob', teams: ['England', 'Germany'] },
  { name: 'Cara', teams: ['Spain', 'Japan'] },
];

const ownerByTeam = new Map<string, string>(
  participants.flatMap((p) => p.teams.map((t) => [t, p.name] as const))
);

const fixtures: Fixture[] = [
  makeFixture('A', 'Brazil', 'England'), // Alice vs Bob
  makeFixture('A', 'France', 'Spain'), // Alice vs Cara
  makeFixture('B', 'Germany', 'Japan'), // Bob vs Cara
  makeFixture('C', 'Spain', 'Japan'), // Cara vs Cara
];

function withFilters(partial: Partial<FixtureFilterState>): FixtureFilterState {
  return { ...EMPTY_FILTERS, ...partial };
}

describe('filterFixtures', () => {
  it('returns all fixtures with no active filters', () => {
    expect(filterFixtures(fixtures, EMPTY_FILTERS, ownerByTeam)).toHaveLength(4);
  });

  it('filters by group (OR within facet)', () => {
    const result = filterFixtures(fixtures, withFilters({ groups: ['A', 'C'] }), ownerByTeam);
    expect(result).toHaveLength(3);
    expect(result.every((f) => f.group === 'A' || f.group === 'C')).toBe(true);
  });

  it('filters by team appearing on either side', () => {
    const result = filterFixtures(fixtures, withFilters({ teams: ['Japan'] }), ownerByTeam);
    expect(result).toHaveLength(2);
  });

  it('filters by people — any fixture involving their teams', () => {
    const result = filterFixtures(fixtures, withFilters({ people: ['Alice'] }), ownerByTeam);
    expect(result).toHaveLength(2);
  });

  it('combines facets with AND', () => {
    const result = filterFixtures(
      fixtures,
      withFilters({ people: ['Alice'], groups: ['A'] }),
      ownerByTeam
    );
    expect(result).toHaveLength(2);
    expect(result.every((f) => f.group === 'A')).toBe(true);
  });

  it('head-to-head keeps only clashes between two different selected people', () => {
    const result = filterFixtures(
      fixtures,
      withFilters({ people: ['Alice', 'Bob'], headToHead: true }),
      ownerByTeam
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ t1: 'Brazil', t2: 'England' });
  });

  it('head-to-head excludes same-owner fixtures', () => {
    const result = filterFixtures(
      fixtures,
      withFilters({ people: ['Cara'], headToHead: true }),
      ownerByTeam
    );
    expect(result).toHaveLength(0);
  });
});

describe('buildFilterOptions', () => {
  it('derives sorted, de-duplicated groups, teams, and people', () => {
    const options = buildFilterOptions(fixtures, participants);
    expect(options.groups).toEqual(['A', 'B', 'C']);
    expect(options.teams).toContain('Japan');
    expect(options.teams).toEqual([...options.teams].sort((a, b) => a.localeCompare(b)));
    expect(options.people).toEqual(['Alice', 'Bob', 'Cara']);
  });
});

describe('count/has active filters', () => {
  it('counts selected facet values but not the head-to-head modifier', () => {
    const filters = withFilters({ people: ['Alice'], groups: ['A', 'B'], headToHead: true });
    expect(countActiveFilters(filters)).toBe(3);
    expect(hasActiveFilters(filters)).toBe(true);
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false);
  });
});
