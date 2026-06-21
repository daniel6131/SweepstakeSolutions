'use client';

import { buildGroupsFromFixtures } from '@/data/groups';
import {
  buildProjectedKnockoutBracket,
  getCompletedKnockoutScoringMatches,
  type KnockoutResult,
} from '@/lib/knockout';
import type { SweepstakeData } from '@/lib/load-data';
import { computeGroupStandings, computeLeaderboard, type ScoringMatch } from '@/lib/scoring';
import type { Fixture, GroupId, KnockoutRoundKey, Participant, ThemeColors } from '@/types';
import { startTransition, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { KnockoutEditor } from './components/KnockoutEditor';
import { PreviewPanel } from './components/PreviewPanel';
import { ScoreEditor } from './components/ScoreEditor';
import { Simulator } from './components/Simulator';

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
  return [Math.floor(Math.random() * 5), Math.floor(Math.random() * 5)];
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
  const fixturesPersistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const knockoutPersistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore from localStorage on mount.
  //
  // The dev console is a local what-if tool on purpose: overrides only live in
  // this browser, never touch the KV snapshot, so they don't leak to other
  // devices and get wiped on the next refresh. Keeps it from ever mutating prod.
  // If I ever want real manual corrections, persist to KV and overlay them in
  // refreshSnapshot.
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

  // Debounced localStorage persistence (~400ms)
  useEffect(() => {
    const payload = fixtures.map((fixture) => ({
      id: fixtureIdentity(fixture),
      s1: fixture.s1,
      s2: fixture.s2,
    }));
    if (fixturesPersistTimer.current) clearTimeout(fixturesPersistTimer.current);
    fixturesPersistTimer.current = setTimeout(() => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    }, 400);
    return () => {
      if (fixturesPersistTimer.current) clearTimeout(fixturesPersistTimer.current);
    };
  }, [fixtures]);

  useEffect(() => {
    if (knockoutPersistTimer.current) clearTimeout(knockoutPersistTimer.current);
    knockoutPersistTimer.current = setTimeout(() => {
      window.localStorage.setItem(KNOCKOUT_STORAGE_KEY, JSON.stringify(knockoutResults));
    }, 400);
    return () => {
      if (knockoutPersistTimer.current) clearTimeout(knockoutPersistTimer.current);
    };
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
  const fixtureIndexById = useMemo(
    () => new Map(fixtures.map((fixture, index) => [fixtureIdentity(fixture), index])),
    [fixtures]
  );
  const visibleFixtures = useMemo(
    () => deferredFixtures.filter((f) => selectedGroup === 'ALL' || f.group === selectedGroup),
    [deferredFixtures, selectedGroup]
  );

  const completedFixtures = deferredFixtures.filter((f) => f.s1 !== null && f.s2 !== null).length;
  const completedKnockoutMatches = bracket.rounds
    .flatMap((round) => round.matches)
    .filter((match) => match.isPlayed).length;
  const topEntry = leaderboard[0];

  function autoPlayKnockoutFromStandings(nextStandings: typeof standings) {
    const nextResults: Partial<Record<number, KnockoutResult>> = {};
    for (const roundKey of KNOCKOUT_ROUND_ORDER) {
      const projectedBracket = buildProjectedKnockoutBracket(nextStandings, nextResults);
      const round = projectedBracket.rounds.find((r) => r.key === roundKey);
      if (!round) continue;
      for (const match of round.matches) {
        if (!match.isReady) continue;
        nextResults[match.match] = randomKnockoutResult();
      }
    }
    return nextResults;
  }

  function updateFixtureScore(index: number, field: 's1' | 's2', value: string) {
    const nextValue = parseScoreValue(value);
    setFixtures((current) =>
      current.map((fixture, i) => (i === index ? { ...fixture, [field]: nextValue } : fixture))
    );
  }

  function updateKnockoutScore(
    matchNumber: number,
    field: 'homeScore' | 'awayScore',
    value: string
  ) {
    const nextValue = parseScoreValue(value);
    setKnockoutResults((current) => {
      const existing = current[matchNumber] ?? { homeScore: null, awayScore: null, winner: null };
      const nextResult: KnockoutResult = { ...existing, [field]: nextValue };
      if (
        nextResult.homeScore === null ||
        nextResult.awayScore === null ||
        nextResult.homeScore !== nextResult.awayScore
      ) {
        nextResult.winner = null;
      }
      return { ...current, [matchNumber]: nextResult };
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

  function clearScores() {
    startTransition(() => {
      setFixtures((current) => current.map((f) => ({ ...f, s1: null, s2: null })));
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

  return (
    <div
      className="min-h-screen px-4 py-6 md:px-6 md:py-8 lg:px-8"
      style={{ background: DEV_THEME.bg, color: '#f5f7fb' }}>
      <div className="mx-auto max-w-[1700px] space-y-8">
        {/* Header */}
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

        {/* Simulator + Score editor side by side */}
        <section className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <Simulator
            selectedGroup={selectedGroup}
            onGroupChange={setSelectedGroup}
            onResetFixtures={resetFixtures}
            onClearScores={clearScores}
            onRandomisePending={randomisePendingFixtures}
            onRandomiseKnockout={randomiseKnockoutRound}
            onRandomiseAll={randomiseAllFixtures}
            onClearSaved={clearSavedState}
          />
          <ScoreEditor
            visibleFixtures={visibleFixtures}
            ownerByTeam={ownerByTeam}
            fixtureIndexById={fixtureIndexById}
            onUpdateScore={updateFixtureScore}
          />
        </section>

        <KnockoutEditor
          bracket={bracket}
          knockoutResults={knockoutResults}
          ownerByTeam={ownerByTeam}
          onUpdateScore={updateKnockoutScore}
          onSetWinner={setKnockoutWinner}
          onClearMatch={clearKnockoutMatch}
        />

        <PreviewPanel
          leaderboard={leaderboard}
          standings={standings}
          groups={groups}
          bracket={bracket}
          ownerByTeam={ownerByTeam}
        />
      </div>
    </div>
  );
}
