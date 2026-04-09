'use client';

import { KnockoutBracket } from '@/components/fixtures/KnockoutBracket';
import { GroupTable } from '@/components/groups/GroupTable';
import { LeaderboardTable } from '@/components/leaderboard/LeaderboardTable';
import { Podium } from '@/components/leaderboard/Podium';
import { GROUP_IDS, buildGroupsFromFixtures } from '@/data/groups';
import {
  buildProjectedKnockoutBracket,
  getCompletedKnockoutScoringMatches,
  type KnockoutRoundKey,
  type KnockoutResult,
} from '@/lib/knockout';
import { computeGroupStandings, computeLeaderboard, type ScoringMatch } from '@/lib/scoring';
import type { SweepstakeData } from '@/lib/load-data';
import type { Fixture, GroupId, Participant, ThemeColors } from '@/types';
import { startTransition, useDeferredValue, useEffect, useMemo, useState } from 'react';

type Props = {
  initialFixtures: Fixture[];
  participants: Participant[];
  sourceLabel: SweepstakeData['dataSource'];
};

const STORAGE_KEY = 'sweepstake-dev-console-fixtures-v1';
const KNOCKOUT_STORAGE_KEY = 'sweepstake-dev-console-knockout-v1';
const KNOCKOUT_ROUND_ORDER: KnockoutRoundKey[] = [
  'roundOf32',
  'roundOf16',
  'quarterFinals',
  'semiFinals',
  'final',
];

const DEV_THEME: ThemeColors = {
  bg: '#08111b',
  accent: '#7ef2cf',
  accent2: '#67b7ff',
  card: '#0f1b28',
};

function parseScoreValue(value: string): number | null {
  if (value.trim() === '') return null;

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;

  return Math.max(0, Math.floor(parsed));
}

function randomScore(): [number, number] {
  const home = Math.floor(Math.random() * 5);
  const away = Math.floor(Math.random() * 5);
  return [home, away];
}

function randomKnockoutResult(): KnockoutResult {
  const [homeScore, awayScore] = randomScore();

  return {
    homeScore,
    awayScore,
    winner: homeScore === awayScore ? (Math.random() > 0.5 ? 'home' : 'away') : null,
  };
}

function fixtureIdentity(fixture: Fixture): string {
  return [fixture.group, fixture.date, fixture.time, fixture.t1, fixture.t2].join('|');
}

export function DevConsoleClient({ initialFixtures, participants, sourceLabel }: Props) {
  const [fixtures, setFixtures] = useState(initialFixtures);
  const [knockoutResults, setKnockoutResults] = useState<Partial<Record<number, KnockoutResult>>>(
    {}
  );
  const [selectedGroup, setSelectedGroup] = useState<GroupId | 'ALL'>('ALL');
  const deferredFixtures = useDeferredValue(fixtures);
  const deferredKnockoutResults = useDeferredValue(knockoutResults);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const saved = JSON.parse(raw) as Array<Pick<Fixture, 's1' | 's2'> & { id: string }>;
      const savedById = new Map(saved.map((entry) => [entry.id, entry]));
      const frame = window.requestAnimationFrame(() => {
        setFixtures(
          initialFixtures.map((fixture) => {
            const override = savedById.get(fixtureIdentity(fixture));
            if (!override) return fixture;
            return { ...fixture, s1: override.s1, s2: override.s2 };
          })
        );
      });

      return () => window.cancelAnimationFrame(frame);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [initialFixtures]);

  useEffect(() => {
    const raw = window.localStorage.getItem(KNOCKOUT_STORAGE_KEY);
    if (!raw) return;

    try {
      const saved = JSON.parse(raw) as Partial<Record<number, KnockoutResult>>;
      const frame = window.requestAnimationFrame(() => {
        setKnockoutResults(saved);
      });

      return () => window.cancelAnimationFrame(frame);
    } catch {
      window.localStorage.removeItem(KNOCKOUT_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    const payload = fixtures.map((fixture) => ({
      id: fixtureIdentity(fixture),
      s1: fixture.s1,
      s2: fixture.s2,
    }));

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [fixtures]);

  useEffect(() => {
    window.localStorage.setItem(KNOCKOUT_STORAGE_KEY, JSON.stringify(knockoutResults));
  }, [knockoutResults]);

  const groups = useMemo(() => buildGroupsFromFixtures(deferredFixtures), [deferredFixtures]);
  const standings = useMemo(
    () => computeGroupStandings(deferredFixtures, groups),
    [deferredFixtures, groups]
  );
  const bracket = useMemo(
    () => buildProjectedKnockoutBracket(standings, deferredKnockoutResults),
    [deferredKnockoutResults, standings]
  );
  const scoringMatches = useMemo(
    () =>
      [
        ...deferredFixtures,
        ...getCompletedKnockoutScoringMatches(bracket),
      ] satisfies ScoringMatch[],
    [bracket, deferredFixtures]
  );
  const leaderboard = useMemo(
    () => computeLeaderboard(scoringMatches, participants),
    [participants, scoringMatches]
  );
  const ownerByTeam = useMemo(
    () =>
      new Map(
        participants.flatMap((participant) =>
          participant.teams.map((team) => [team, participant.name] as const)
        )
      ),
    [participants]
  );

  const visibleFixtures = useMemo(
    () =>
      deferredFixtures.filter(
        (fixture) => selectedGroup === 'ALL' || fixture.group === selectedGroup
      ),
    [deferredFixtures, selectedGroup]
  );
  const completedFixtures = deferredFixtures.filter(
    (fixture) => fixture.s1 !== null && fixture.s2 !== null
  ).length;
  const completedKnockoutMatches = bracket.rounds
    .flatMap((round) => round.matches)
    .filter((match) => match.isPlayed).length;
  const topEntry = leaderboard[0];

  function updateFixtureScore(index: number, field: 's1' | 's2', value: string) {
    const nextValue = parseScoreValue(value);

    setFixtures((current) =>
      current.map((fixture, fixtureIndex) =>
        fixtureIndex === index ? { ...fixture, [field]: nextValue } : fixture
      )
    );
  }

  function clearScores() {
    startTransition(() => {
      setFixtures((current) => current.map((fixture) => ({ ...fixture, s1: null, s2: null })));
      setKnockoutResults({});
    });
  }

  function resetFixtures() {
    startTransition(() => {
      setFixtures(initialFixtures);
      setKnockoutResults({});
    });
  }

  function randomisePendingFixtures() {
    startTransition(() => {
      setFixtures((current) =>
        current.map((fixture) => {
          if (fixture.s1 !== null && fixture.s2 !== null) return fixture;
          const [s1, s2] = randomScore();
          return { ...fixture, s1, s2 };
        })
      );
      setKnockoutResults({});
    });
  }

  function randomiseAllFixtures() {
    startTransition(() => {
      const nextFixtures = fixtures.map((fixture) => {
        const [s1, s2] = randomScore();
        return { ...fixture, s1, s2 };
      });
      const nextGroups = buildGroupsFromFixtures(nextFixtures);
      const nextStandings = computeGroupStandings(nextFixtures, nextGroups);

      setFixtures(nextFixtures);
      setKnockoutResults(autoPlayKnockoutFromStandings(nextStandings));
    });
  }

  function randomiseKnockoutRound() {
    startTransition(() => {
      setKnockoutResults(autoPlayKnockoutFromStandings(standings));
    });
  }

  function clearSavedState() {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(KNOCKOUT_STORAGE_KEY);
    startTransition(() => {
      setFixtures(initialFixtures);
      setKnockoutResults({});
    });
  }

  function autoPlayKnockoutFromStandings(nextStandings: typeof standings) {
    const nextResults: Partial<Record<number, KnockoutResult>> = {};

    for (const roundKey of KNOCKOUT_ROUND_ORDER) {
      const projectedBracket = buildProjectedKnockoutBracket(nextStandings, nextResults);
      const round = projectedBracket.rounds.find((candidate) => candidate.key === roundKey);
      if (!round) continue;

      for (const match of round.matches) {
        if (!match.isReady) continue;
        nextResults[match.match] = randomKnockoutResult();
      }
    }

    return nextResults;
  }

  function updateKnockoutScore(
    matchNumber: number,
    field: 'homeScore' | 'awayScore',
    value: string
  ) {
    const nextValue = parseScoreValue(value);

    setKnockoutResults((current) => {
      const existing = current[matchNumber] ?? {
        homeScore: null,
        awayScore: null,
        winner: null,
      };
      const nextResult: KnockoutResult = {
        ...existing,
        [field]: nextValue,
      };

      if (
        nextResult.homeScore === null ||
        nextResult.awayScore === null ||
        nextResult.homeScore !== nextResult.awayScore
      ) {
        nextResult.winner = null;
      }

      return {
        ...current,
        [matchNumber]: nextResult,
      };
    });
  }

  function setKnockoutWinner(matchNumber: number, winner: 'home' | 'away') {
    setKnockoutResults((current) => ({
      ...current,
      [matchNumber]: {
        homeScore: current[matchNumber]?.homeScore ?? null,
        awayScore: current[matchNumber]?.awayScore ?? null,
        winner,
      },
    }));
  }

  function clearKnockoutMatch(matchNumber: number) {
    setKnockoutResults((current) => {
      const next = { ...current };
      delete next[matchNumber];
      return next;
    });
  }

  return (
    <div
      className="min-h-screen px-4 py-6 md:px-6 md:py-8 lg:px-8"
      style={{ background: DEV_THEME.bg, color: '#f5f7fb' }}>
      <div className="mx-auto max-w-[1700px] space-y-8">
        <section
          className="overflow-hidden rounded-[32px] p-5 md:p-7"
          style={{
            background: `radial-gradient(circle at top right, ${DEV_THEME.accent}18 0%, transparent 30%), linear-gradient(180deg, ${DEV_THEME.card} 0%, #122132 100%)`,
            border: `1px solid ${DEV_THEME.accent}18`,
            boxShadow: `0 28px 90px ${DEV_THEME.bg}55`,
          }}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div
                className="font-heading mb-2 text-[10px] font-bold uppercase tracking-[3px]"
                style={{ color: `${DEV_THEME.accent}70` }}>
                Protected Tooling
              </div>
              <h1
                className="font-display text-[34px] leading-none tracking-[-0.05em] md:text-[56px]"
                style={{ color: DEV_THEME.accent }}>
                Dev Console
              </h1>
              <p
                className="mt-3 max-w-2xl text-sm leading-6 md:text-[15px]"
                style={{ color: 'rgba(245,247,251,0.78)' }}>
                Edit scores fixture-by-fixture, simulate full tournaments, and validate the
                leaderboard, groups, and knockout path against the same scoring logic used by the
                live app.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {[
                ['Source', sourceLabel],
                ['Groups', `${completedFixtures}/${fixtures.length}`],
                ['Knockout', `${completedKnockoutMatches}`],
                ['Leader', topEntry?.name ?? '—'],
                ['Leader GD', topEntry ? `${topEntry.gd > 0 ? '+' : ''}${topEntry.gd}` : '—'],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl px-4 py-3"
                  style={{
                    background: `${DEV_THEME.accent}0b`,
                    border: `1px solid ${DEV_THEME.accent}18`,
                  }}>
                  <div
                    className="font-heading text-[9px] font-bold uppercase tracking-[2px]"
                    style={{ color: `${DEV_THEME.accent}4d` }}>
                    {label}
                  </div>
                  <div
                    className="font-display mt-1 text-[19px]"
                    style={{ color: DEV_THEME.accent }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <div
            className="rounded-[28px] p-4 md:p-5"
            style={{
              background: `linear-gradient(180deg, ${DEV_THEME.card}f2 0%, ${DEV_THEME.card}dc 100%)`,
              border: `1px solid ${DEV_THEME.accent}14`,
            }}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div
                  className="font-heading text-[10px] font-bold uppercase tracking-[3px]"
                  style={{ color: `${DEV_THEME.accent}58` }}>
                  Controls
                </div>
                <div
                  className="font-display mt-1 text-[28px] leading-none tracking-[-0.04em]"
                  style={{ color: DEV_THEME.accent }}>
                  Simulation
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {[
                {
                  title: 'Fixture state',
                  actions: [
                    { label: 'Reset to source', action: resetFixtures },
                    { label: 'Clear all scores', action: clearScores },
                    { label: 'Randomise pending', action: randomisePendingFixtures },
                  ],
                },
                {
                  title: 'Knockout automation',
                  actions: [
                    { label: 'Auto-play knockout', action: randomiseKnockoutRound },
                    { label: 'Randomise full tournament', action: randomiseAllFixtures },
                  ],
                },
                {
                  title: 'Storage',
                  actions: [{ label: 'Clear saved console state', action: clearSavedState }],
                },
              ].map((group) => (
                <div key={group.title}>
                  <div
                    className="font-heading mb-2 text-[9px] font-bold uppercase tracking-[2px]"
                    style={{ color: `${DEV_THEME.accent}46` }}>
                    {group.title}
                  </div>
                  <div className="grid gap-2">
                    {group.actions.map(({ label, action }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={action}
                        className="font-heading cursor-pointer rounded-2xl px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[2px] transition-transform duration-200 hover:-translate-y-0.5"
                        style={{
                          background: `${DEV_THEME.accent}0a`,
                          border: `1px solid ${DEV_THEME.accent}14`,
                          color: '#f5f7fb',
                        }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5">
              <div
                className="font-heading mb-2 text-[10px] font-bold uppercase tracking-[3px]"
                style={{ color: `${DEV_THEME.accent}58` }}>
                Filter
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedGroup('ALL')}
                  className="font-heading cursor-pointer rounded-full px-3 py-2 text-[10px] font-bold uppercase tracking-[2px]"
                  style={{
                    background:
                      selectedGroup === 'ALL' ? DEV_THEME.accent : `${DEV_THEME.accent}08`,
                    color: selectedGroup === 'ALL' ? DEV_THEME.bg : DEV_THEME.accent,
                    border: `1px solid ${DEV_THEME.accent}18`,
                  }}>
                  All groups
                </button>
                {GROUP_IDS.map((group) => (
                  <button
                    key={group}
                    type="button"
                    onClick={() => setSelectedGroup(group)}
                    className="font-heading cursor-pointer rounded-full px-3 py-2 text-[10px] font-bold uppercase tracking-[2px]"
                    style={{
                      background:
                        selectedGroup === group ? DEV_THEME.accent : `${DEV_THEME.accent}08`,
                      color: selectedGroup === group ? DEV_THEME.bg : DEV_THEME.accent,
                      border: `1px solid ${DEV_THEME.accent}18`,
                    }}>
                    Group {group}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div
            className="rounded-[28px] p-4 md:p-5"
            style={{
              background: `linear-gradient(180deg, ${DEV_THEME.card}f2 0%, ${DEV_THEME.card}dc 100%)`,
              border: `1px solid ${DEV_THEME.accent}14`,
            }}>
            <div className="mb-4">
              <div
                className="font-heading text-[10px] font-bold uppercase tracking-[3px]"
                style={{ color: `${DEV_THEME.accent}58` }}>
                Fixture Editor
              </div>
              <div
                className="font-display mt-1 text-[28px] leading-none tracking-[-0.04em]"
                style={{ color: DEV_THEME.accent }}>
                Override scores
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
              {visibleFixtures.map((fixture) => {
                const fixtureIndex = fixtures.findIndex(
                  (candidate) => fixtureIdentity(candidate) === fixtureIdentity(fixture)
                );

                return (
                  <div
                    key={fixtureIdentity(fixture)}
                    className="rounded-[24px] p-4"
                    style={{
                      background: `${DEV_THEME.accent}06`,
                      border: `1px solid ${DEV_THEME.accent}14`,
                    }}>
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div
                        className="font-heading rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[2px]"
                        style={{ background: DEV_THEME.accent, color: DEV_THEME.bg }}>
                        Group {fixture.group}
                      </div>
                      <div
                        className="font-heading text-[9px] font-bold uppercase tracking-[2px]"
                        style={{ color: `${DEV_THEME.accent}5c` }}>
                        {fixture.date} · {fixture.time}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {(
                        [
                          ['t1', 's1'],
                          ['t2', 's2'],
                        ] as const
                      ).map(([teamField, scoreField]) => (
                        <div key={teamField} className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-display truncate text-[16px]">
                              {fixture[teamField]}
                            </div>
                            <div
                              className="text-[10px] font-medium"
                              style={{ color: `${DEV_THEME.accent}4d` }}>
                              {ownerByTeam.get(fixture[teamField]) ?? '—'}
                            </div>
                          </div>
                          <input
                            type="number"
                            min="0"
                            inputMode="numeric"
                            value={fixture[scoreField] ?? ''}
                            onChange={(event) =>
                              updateFixtureScore(fixtureIndex, scoreField, event.target.value)
                            }
                            className="w-18 rounded-2xl border px-3 py-2 text-center text-sm font-bold outline-none"
                            style={{
                              background: `${DEV_THEME.bg}d9`,
                              borderColor: `${DEV_THEME.accent}1c`,
                              color: DEV_THEME.accent,
                            }}
                          />
                        </div>
                      ))}
                    </div>

                    <div
                      className="font-heading mt-3 truncate text-[9px] font-bold uppercase tracking-[2px]"
                      style={{ color: `${DEV_THEME.accent}40` }}>
                      {fixture.venue}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section
          className="rounded-[28px] p-4 md:p-5"
          style={{
            background: `linear-gradient(180deg, ${DEV_THEME.card}f2 0%, ${DEV_THEME.card}dc 100%)`,
            border: `1px solid ${DEV_THEME.accent}14`,
          }}>
          <div className="mb-4">
            <div
              className="font-heading text-[10px] font-bold uppercase tracking-[3px]"
              style={{ color: `${DEV_THEME.accent}58` }}>
              Knockout Editor
            </div>
            <div
              className="font-display mt-1 text-[28px] leading-none tracking-[-0.04em]"
              style={{ color: DEV_THEME.accent }}>
              Resolve bracket results
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {bracket.rounds.map((round) => (
              <div
                key={round.key}
                className="rounded-[24px] p-4"
                style={{
                  background: `${DEV_THEME.accent}05`,
                  border: `1px solid ${DEV_THEME.accent}14`,
                }}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <div
                      className="font-heading text-[9px] font-bold uppercase tracking-[2px]"
                      style={{ color: `${DEV_THEME.accent}46` }}>
                      {round.shortTitle}
                    </div>
                    <div className="font-display text-[20px]" style={{ color: DEV_THEME.accent }}>
                      {round.title}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {round.matches.map((match) => {
                    const result = knockoutResults[match.match];
                    const needsWinner =
                      match.isReady &&
                      result?.homeScore !== null &&
                      result?.awayScore !== null &&
                      result?.homeScore === result?.awayScore;

                    return (
                      <div
                        key={match.match}
                        className="rounded-[20px] p-3"
                        style={{
                          background: `${DEV_THEME.bg}b8`,
                          border: `1px solid ${
                            match.isPlayed ? `${DEV_THEME.accent}22` : `${DEV_THEME.accent}14`
                          }`,
                        }}>
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <div
                            className="font-heading rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[2px]"
                            style={{ background: DEV_THEME.accent, color: DEV_THEME.bg }}>
                            Match {match.match}
                          </div>
                          <div
                            className="font-heading text-[9px] font-bold uppercase tracking-[2px]"
                            style={{ color: `${DEV_THEME.accent}48` }}>
                            {match.date}
                          </div>
                        </div>

                        {(['home', 'away'] as const).map((side) => {
                          const slot = match[side];
                          const field = side === 'home' ? 'homeScore' : 'awayScore';

                          return (
                            <div
                              key={side}
                              className="mb-2 flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <div className="font-display truncate text-[16px]">
                                  {slot.label}
                                </div>
                                <div
                                  className="text-[10px] font-medium"
                                  style={{ color: `${DEV_THEME.accent}4d` }}>
                                  {slot.team ? (ownerByTeam.get(slot.team) ?? '—') : slot.seedLabel}
                                </div>
                              </div>
                              <input
                                type="number"
                                min="0"
                                inputMode="numeric"
                                disabled={!match.isReady}
                                value={result?.[field] ?? ''}
                                onChange={(event) =>
                                  updateKnockoutScore(match.match, field, event.target.value)
                                }
                                className="w-18 rounded-2xl border px-3 py-2 text-center text-sm font-bold outline-none disabled:cursor-not-allowed disabled:opacity-40"
                                style={{
                                  background: `${DEV_THEME.bg}d9`,
                                  borderColor: `${DEV_THEME.accent}1c`,
                                  color: DEV_THEME.accent,
                                }}
                              />
                            </div>
                          );
                        })}

                        {needsWinner ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {(['home', 'away'] as const).map((side) => (
                              <button
                                key={side}
                                type="button"
                                onClick={() => setKnockoutWinner(match.match, side)}
                                className="font-heading cursor-pointer rounded-full px-3 py-2 text-[10px] font-bold uppercase tracking-[2px]"
                                style={{
                                  background:
                                    result?.winner === side
                                      ? DEV_THEME.accent
                                      : `${DEV_THEME.accent}08`,
                                  color: result?.winner === side ? DEV_THEME.bg : DEV_THEME.accent,
                                  border: `1px solid ${DEV_THEME.accent}18`,
                                }}>
                                Winner: {match[side].label}
                              </button>
                            ))}
                          </div>
                        ) : null}

                        <div className="mt-3 flex items-center justify-between gap-3">
                          <div
                            className="font-heading text-[8px] font-bold uppercase tracking-[2px]"
                            style={{ color: `${DEV_THEME.accent}40` }}>
                            {match.venue}
                          </div>
                          <button
                            type="button"
                            onClick={() => clearKnockoutMatch(match.match)}
                            className="font-heading cursor-pointer rounded-full px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[2px]"
                            style={{
                              background: `${DEV_THEME.accent}06`,
                              color: `${DEV_THEME.accent}78`,
                              border: `1px solid ${DEV_THEME.accent}12`,
                            }}>
                            Clear
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-8">
          <div>
            <div
              className="font-heading mb-2 text-[10px] font-bold uppercase tracking-[3px]"
              style={{ color: `${DEV_THEME.accent}58` }}>
              Preview
            </div>
            <div
              className="font-display text-[34px] leading-none tracking-[-0.05em]"
              style={{ color: DEV_THEME.accent }}>
              Recomputed outputs
            </div>
          </div>

          <div>
            <Podium top3={leaderboard.slice(0, 3)} theme={DEV_THEME} />
            <LeaderboardTable entries={leaderboard} theme={DEV_THEME} />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(340px,1fr))] md:gap-4">
            {GROUP_IDS.map((group) => (
              <GroupTable
                key={group}
                group={group}
                teams={groups[group]}
                ownerByTeam={ownerByTeam}
                standings={standings[group]}
                theme={DEV_THEME}
              />
            ))}
          </div>

          <KnockoutBracket bracket={bracket} ownerByTeam={ownerByTeam} theme={DEV_THEME} />
        </section>
      </div>
    </div>
  );
}
