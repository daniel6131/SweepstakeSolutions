'use client';

import { COUNTRY_CODES } from '@/data/countryCodes';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/* ═══════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════ */

type Assignment = { player: string; team: string; group: string; round: number };
type Conflict = { player: string; conflicts: string[] };

type DraftState = {
  status: 'pending' | 'drafting' | 'trading' | 'locked';
  currentRound: number;
  currentPick: number;
  playerOrder: string[];
  assignments: Assignment[];
  availableTeams: string[];
  conflicts?: Conflict[];
  lastDrawn?: Assignment;
};

type DrawPhase = 'idle' | 'spinning' | 'charging' | 'locking' | 'revealing' | 'dealt';

/* ═══════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════ */

const C = {
  bg: '#001214',
  accent: '#94FFE4',
  accent2: '#06D6A0',
  card: '#001f23',
  danger: '#FF6B6B',
};

function flagUrl(team: string, size = 80): string {
  const code = COUNTRY_CODES[team] || '';
  return `https://flagcdn.com/w${size}/${code}.png`;
}

function getPlayerTeams(assignments: Assignment[], player: string): Assignment[] {
  return assignments.filter((a) => a.player === player);
}

function isConflictTeam(conflicts: Conflict[], player: string, team: string): boolean {
  const c = conflicts.find((x) => x.player === player);
  return c ? c.conflicts.includes(team) : false;
}

function mulberry32(seed: number): () => number {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWithSeed<T>(list: T[], seed: number): T[] {
  const rand = mulberry32(seed);
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function teaseName(team: string): string {
  if (!team) return '';
  const trimmed = team.trim();
  if (trimmed.length <= 2) return `${trimmed}...`;
  return `${trimmed.slice(0, 2).toUpperCase()}...`;
}

const FLAG_STYLE = { width: 'auto', height: 'auto', objectFit: 'cover' } as const;

/* ═══════════════════════════════════════════════════════════
   API calls
   ═══════════════════════════════════════════════════════════ */

async function api(action?: string, params?: Record<string, string>): Promise<DraftState> {
  if (!action) {
    const res = await fetch('/api/draft');
    return res.json();
  }
  const res = await fetch('/api/draft', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...params }),
  });
  return res.json();
}

/* ═══════════════════════════════════════════════════════════
   Burst particles (CSS-animated dots)
   ═══════════════════════════════════════════════════════════ */

function BurstParticles({ active, seed }: { active: boolean; seed: number }) {
  if (!active) return null;
  const rand = mulberry32(seed);
  const particles = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * 360;
    const dist = 60 + rand() * 80;
    const px = Math.cos((angle * Math.PI) / 180) * dist;
    const py = Math.sin((angle * Math.PI) / 180) * dist;
    const size = 4 + rand() * 6;
    return (
      <div
        key={i}
        className="absolute left-1/2 top-1/2 rounded-full"
        style={{
          width: size,
          height: size,
          background: i % 3 === 0 ? C.accent : i % 3 === 1 ? C.accent2 : '#fff',
          marginLeft: -size / 2,
          marginTop: -size / 2,
          animation: `particle-fly 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
          animationDelay: `${i * 0.02}s`,
          ['--px' as string]: `${px}px`,
          ['--py' as string]: `${py}px`,
        }}
      />
    );
  });
  return <div className="pointer-events-none absolute inset-0">{particles}</div>;
}

/* ═══════════════════════════════════════════════════════════
   Phase: PENDING — Intro screen
   ═══════════════════════════════════════════════════════════ */

function IntroScreen({ onStart }: { onStart: () => void }) {
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    setTimeout(() => setEntered(true), 100);
  }, []);

  return (
    <div className="flex min-h-[100svh] flex-col items-center justify-center px-6 text-center">
      {/* Title */}
      <div
        className="font-display tracking-[-0.03em]"
        style={{
          fontSize: 'clamp(64px, 18vw, 180px)',
          lineHeight: 0.85,
          WebkitTextStroke: `2px ${C.accent}`,
          WebkitTextFillColor: 'transparent',
          opacity: entered ? 1 : 0,
          transform: entered ? 'translateY(0)' : 'translateY(40px)',
          transition: 'all 1.2s cubic-bezier(0.19, 1, 0.22, 1)',
        }}>
        THE DRAFT
      </div>

      {/* Subtitle */}
      <div
        className="font-heading mt-4 text-xs font-semibold uppercase tracking-[6px] md:mt-6 md:text-sm md:tracking-[8px]"
        style={{
          color: `${C.accent}40`,
          opacity: entered ? 1 : 0,
          transform: entered ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 1s cubic-bezier(0.19, 1, 0.22, 1) 0.3s',
        }}>
        48 NATIONS · 12 PLAYERS · 4 ROUNDS
      </div>

      {/* Orb preview */}
      <div
        className="relative mx-auto mt-10 md:mt-14"
        style={{
          width: 100,
          height: 100,
          opacity: entered ? 1 : 0,
          transition: 'opacity 1s ease 0.6s',
        }}>
        <div className="draft-orb draft-orb--pulse" />
      </div>

      {/* Start button */}
      <button
        onClick={onStart}
        className="font-heading mt-10 cursor-pointer rounded-full px-10 py-4 text-sm font-bold uppercase tracking-[4px] transition-all duration-500 hover:scale-105 md:mt-14 md:px-14 md:py-5 md:text-base"
        style={{
          background: `${C.accent}12`,
          border: `2px solid ${C.accent}30`,
          color: C.accent,
          opacity: entered ? 1 : 0,
          transform: entered ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 1s cubic-bezier(0.19, 1, 0.22, 1) 0.8s, scale 0.3s ease',
          boxShadow: `0 0 40px ${C.accent}15`,
        }}>
        BEGIN THE DRAFT
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Phase: DRAFTING — The ceremony
   ═══════════════════════════════════════════════════════════ */

function DraftCeremony({
  state,
  onDraw,
  roundTransition,
  onCommitDraw,
}: {
  state: DraftState;
  onDraw: () => Promise<Assignment | null>;
  roundTransition: boolean;
  onCommitDraw: () => void;
}) {
  const [drawPhase, setDrawPhase] = useState<DrawPhase>('idle');
  const [revealed, setRevealed] = useState<Assignment | null>(null);
  const [burstSeed, setBurstSeed] = useState(1);
  const [teaseIndex, setTeaseIndex] = useState(0);
  const rollStartRef = useRef<number | null>(null);
  const rollTotalRef = useRef(0);
  const teaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentPlayer = state.playerOrder[state.currentPick] || '';
  const isBuildingSuspense = drawPhase === 'spinning' || drawPhase === 'charging';
  const isLocking = drawPhase === 'locking';
  const showReveal = drawPhase === 'revealing';

  const teaseTeams = useMemo(() => {
    if ((!isBuildingSuspense && !isLocking) || state.availableTeams.length === 0) return [];
    const seed = (state.currentRound + 1) * 1000 + (state.currentPick + 1) * 37 + burstSeed;
    const list = shuffleWithSeed(state.availableTeams, seed).slice(0, 12);
    if (isLocking && revealed && !list.includes(revealed.team)) {
      list[0] = revealed.team;
    }
    return list;
  }, [
    isBuildingSuspense,
    isLocking,
    revealed,
    state.availableTeams,
    state.currentPick,
    state.currentRound,
    burstSeed,
  ]);

  useEffect(() => {
    if (!isBuildingSuspense || teaseTeams.length === 0) return;

    const tick = () => {
      setTeaseIndex((idx) => (idx + 1) % teaseTeams.length);

      const start = rollStartRef.current ?? Date.now();
      const total = rollTotalRef.current || 1;
      const elapsed = Date.now() - start;
      const t = Math.min(elapsed / total, 1);
      const ease = t < 0.7 ? (t / 0.7) ** 2 * 0.35 : 0.35 + ((t - 0.7) / 0.3) ** 4 * 0.65;
      const minDelay = 30;
      const maxDelay = 1800;
      const delay = minDelay + (maxDelay - minDelay) * ease;

      teaseTimerRef.current = setTimeout(tick, delay);
    };

    teaseTimerRef.current = setTimeout(tick, 30);

    return () => {
      if (teaseTimerRef.current) {
        clearTimeout(teaseTimerRef.current);
      }
    };
  }, [isBuildingSuspense, teaseTeams.length]);

  const reelReady = (isBuildingSuspense || isLocking) && teaseTeams.length > 0;
  const lockIndex = isLocking && revealed ? teaseTeams.indexOf(revealed.team) : -1;
  const reelIndex =
    teaseTeams.length > 0 ? (lockIndex >= 0 ? lockIndex : teaseIndex % teaseTeams.length) : 0;
  const getTeaseTeam = (offset: number) =>
    teaseTeams.length > 0
      ? teaseTeams[(reelIndex + offset + teaseTeams.length) % teaseTeams.length]
      : '';
  const teaseOffsets = [-2, -1, 0, 1, 2];

  const handleDraw = async () => {
    if (drawPhase !== 'idle') return;

    const spinMs = 2400;
    const chargeMs = 2800;
    const lockMs = 2000;
    const revealMs = 3200;
    const idleDelayMs = 900;

    // Phase 1: Spinning
    rollStartRef.current = Date.now();
    rollTotalRef.current = spinMs + chargeMs + lockMs;
    setTeaseIndex(0);
    setDrawPhase('spinning');

    // Phase 2: Reveal after spin
    setTimeout(() => {
      setDrawPhase('charging');
      setTimeout(async () => {
        const drawn = await onDraw();
        if (drawn) {
          setRevealed(drawn);
          setDrawPhase('locking');

          setTimeout(() => {
            setBurstSeed((seed) => seed + 1);
            setDrawPhase('revealing');
            setTimeout(() => {
              setDrawPhase('dealt');
              onCommitDraw();
              // Reset for next pick
              setTimeout(() => {
                setDrawPhase('idle');
                setRevealed(null);
              }, idleDelayMs);
            }, revealMs);
          }, lockMs);
        }
      }, chargeMs);
    }, spinMs);
  };

  // Round transition overlay
  if (roundTransition) {
    return (
      <div className="flex min-h-[100svh] flex-col items-center justify-center text-center">
        <div
          className="font-heading text-xs font-bold uppercase tracking-[6px] md:text-sm"
          style={{ color: `${C.accent}50`, animation: 'hero-fade-in 0.6s ease both' }}>
          ROUND {state.currentRound} OF 4
        </div>
        <div
          className="font-display mt-3 tracking-[-0.02em]"
          style={{
            fontSize: 'clamp(40px, 10vw, 80px)',
            color: C.accent,
            animation: 'hero-fade-in 0.8s ease 0.2s both',
          }}>
          {state.currentRound < 4 ? 'NEXT ROUND' : 'TRADING TIME'}
        </div>
      </div>
    );
  }

  // Trading transition
  if (state.status === 'trading') {
    return (
      <div className="flex min-h-[100svh] flex-col items-center justify-center text-center">
        <div
          className="font-display tracking-[-0.02em]"
          style={{
            fontSize: 'clamp(40px, 10vw, 80px)',
            color: C.accent,
            animation: 'hero-fade-in 0.8s ease both',
          }}>
          DRAFT COMPLETE
        </div>
        <div
          className="font-heading mt-4 text-xs font-semibold uppercase tracking-[5px] md:text-sm"
          style={{ color: `${C.accent}40`, animation: 'hero-fade-in 0.8s ease 0.3s both' }}>
          TIME TO TRADE
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[100svh] flex-col items-center px-4 pt-14 pb-4 md:pt-16">
      <div className="draft-arena">
        <div className="draft-mesh" />
        <div className="draft-confetti" />
        <div className="draft-aurora" />
        <div className={`draft-vignette ${isBuildingSuspense ? 'is-active' : ''}`} />
        <div className={`draft-scanlines ${drawPhase === 'charging' ? 'is-active' : ''}`} />
      </div>

      {/* Round + Pick indicator */}
      <div
        className="font-heading text-[10px] font-bold uppercase tracking-[5px] md:text-xs"
        style={{ color: `${C.accent}35` }}>
        ROUND {state.currentRound + 1} OF 4 · PICK {state.currentPick + 1} OF{' '}
        {state.playerOrder.length}
      </div>

      {/* Current player */}
      <div
        className="font-display mt-4 tracking-wide md:mt-6"
        style={{
          fontSize: 'clamp(32px, 7vw, 56px)',
          color: C.accent,
        }}>
        {currentPlayer}
      </div>

      <div className="draft-status">
        <div className={`draft-suspense ${isBuildingSuspense ? 'is-active' : ''}`}>
          <div className="draft-suspense__label">THE DRAW IS LOADING</div>
          <div className="draft-suspense__meter">
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
        <div className={`draft-idle ${drawPhase === 'idle' ? 'is-active' : ''}`}>
          TAP TO OPEN THE PACK
        </div>
      </div>

      {/* The Pack — center stage */}
      <div className={`draft-stage ${reelReady || showReveal ? 'is-rolling' : ''}`}>
        <div
          className={`draft-pack ${
            drawPhase === 'idle' || drawPhase === 'dealt'
              ? 'is-idle'
              : drawPhase === 'spinning'
                ? 'is-spinning'
                : drawPhase === 'charging'
                  ? 'is-charging'
                  : drawPhase === 'locking'
                    ? 'is-locking'
                    : 'is-revealing'
          }`}
          onClick={handleDraw}
          style={{ cursor: drawPhase === 'idle' ? 'pointer' : 'default' }}>
          <div className="draft-pack__frame" />
          <div className="draft-pack__core" />
          <div className="draft-pack__sweep" />
          <div className="draft-pack__pulse" />
        </div>

        <div
          className={`draft-card-stack ${
            reelReady ? (drawPhase === 'charging' ? 'is-charging' : 'is-spinning') : 'is-idle'
          }`}>
          {reelReady &&
            teaseOffsets.map((offset) => {
              const team = getTeaseTeam(offset);
              const hue = team ? (team.charCodeAt(0) * 17 + team.length * 13) % 360 : 180;
              return (
                <div
                  key={`${team}-${offset}`}
                  className={`draft-card draft-card--${offset}`}
                  style={{ ['--hue' as string]: `${hue}` }}>
                  <div className="draft-card__glow" />
                  <div className="draft-card__content">
                    <Image
                      src={flagUrl(team, 80)}
                      alt={team}
                      width={36}
                      height={24}
                      style={FLAG_STYLE}
                    />
                    <div className="draft-card__name">{offset === 0 ? team : teaseName(team)}</div>
                    <div className="draft-card__tag">
                      {offset === 0 ? 'LOCKING IN' : 'POSSIBLE'}
                    </div>
                  </div>
                </div>
              );
            })}
          <div className="draft-card-stack__frame" />
        </div>

        {/* Reveal overlay */}
        {showReveal && revealed && (
          <div className={`draft-reveal ${isLocking ? 'is-locking' : 'is-revealed'}`}>
            <div className="draft-reveal__veil">
              <span />
              <span />
              <span />
            </div>
            <Image
              src={flagUrl(revealed.team, 160)}
              alt={revealed.team}
              width={96}
              height={62}
              className="draft-reveal__flag"
              style={FLAG_STYLE}
            />
            <div className="draft-reveal__name">
              {isLocking ? teaseName(revealed.team) : revealed.team}
            </div>
            <div className="draft-reveal__meta">GROUP {revealed.group}</div>
          </div>
        )}

        <BurstParticles active={drawPhase === 'revealing'} seed={burstSeed} />
      </div>

      {/* Player roster — bottom */}
      <div className="mt-auto w-full max-w-2xl pt-4">
        <div className="grid grid-cols-3 gap-2 md:grid-cols-4 md:gap-3">
          {state.playerOrder.map((name, i) => {
            const teams = getPlayerTeams(state.assignments, name);
            const isCurrent = i === state.currentPick;
            const isDone = i < state.currentPick;
            return (
              <div
                key={name}
                className="rounded-lg px-2 py-2 text-center transition-all duration-300 md:rounded-xl md:px-3 md:py-3"
                style={{
                  background: isCurrent ? `${C.accent}10` : `${C.accent}04`,
                  border: isCurrent ? `1.5px solid ${C.accent}30` : `1px solid ${C.accent}08`,
                  opacity: isDone ? 0.5 : 1,
                }}>
                <div
                  className="font-heading text-[11px] font-bold md:text-xs"
                  style={{ color: isCurrent ? C.accent : `${C.accent}60` }}>
                  {name}
                </div>
                <div className="mt-1 flex flex-wrap justify-center gap-0.5">
                  {teams.map((t) => (
                    <Image
                      key={t.team}
                      src={flagUrl(t.team, 40)}
                      alt={t.team}
                      width={18}
                      height={12}
                      className="rounded-sm"
                      style={FLAG_STYLE}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Phase: TRADING — The trading floor
   ═══════════════════════════════════════════════════════════ */

function TradingFloor({
  state,
  onTrade,
  onLock,
}: {
  state: DraftState;
  onTrade: (p1: string, t1: string, p2: string, t2: string) => void;
  onLock: () => void;
}) {
  const [selected, setSelected] = useState<{ player: string; team: string } | null>(null);
  const conflicts = state.conflicts || [];
  const totalConflicts = conflicts.reduce((n, c) => n + c.conflicts.length, 0);

  const handleSelect = (player: string, team: string) => {
    if (!selected) {
      setSelected({ player, team });
      return;
    }

    // Same player — deselect
    if (selected.player === player && selected.team === team) {
      setSelected(null);
      return;
    }

    // Same player different team — reselect
    if (selected.player === player) {
      setSelected({ player, team });
      return;
    }

    // Different player — propose trade
    onTrade(selected.player, selected.team, player, team);
    setSelected(null);
  };

  const players = [...new Set(state.assignments.map((a) => a.player))];

  return (
    <div className="min-h-[100svh] px-4 pt-20 pb-10 md:px-8 md:pt-24">
      {/* Header */}
      <div className="mb-8 text-center md:mb-12">
        <div
          className="font-display tracking-[-0.02em]"
          style={{ fontSize: 'clamp(32px, 8vw, 64px)', color: C.accent }}>
          TRADING FLOOR
        </div>
        <div
          className="font-heading mt-2 text-xs font-semibold uppercase tracking-[4px] md:text-sm"
          style={{ color: `${C.accent}40` }}>
          {totalConflicts > 0
            ? `${totalConflicts} CONFLICT${totalConflicts > 1 ? 'S' : ''} — TAP TWO TEAMS TO SWAP`
            : 'NO CONFLICTS — READY TO LOCK IN'}
        </div>
        {selected && (
          <div
            className="font-heading mt-3 text-xs font-bold uppercase tracking-[3px]"
            style={{ color: C.accent }}>
            TRADING: {selected.player}&apos;S {selected.team} → SELECT A TEAM TO SWAP WITH
          </div>
        )}
      </div>

      {/* Player cards */}
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 md:gap-4">
        {players.map((player) => {
          const teams = getPlayerTeams(state.assignments, player);
          const playerConflicts = conflicts.find((c) => c.player === player);
          const hasConflict = !!playerConflicts;

          return (
            <div
              key={player}
              className="overflow-hidden rounded-xl md:rounded-2xl"
              style={{
                background: C.card,
                border: `1.5px solid ${hasConflict ? `${C.danger}30` : `${C.accent}10`}`,
              }}>
              {/* Player name */}
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{
                  borderBottom: `1px solid ${C.accent}08`,
                  background: hasConflict ? `${C.danger}08` : `${C.accent}04`,
                }}>
                <span
                  className="font-heading text-sm font-bold"
                  style={{ color: hasConflict ? C.danger : C.accent }}>
                  {player}
                </span>
                {hasConflict && (
                  <span
                    className="font-heading text-[9px] font-bold uppercase tracking-[2px]"
                    style={{ color: `${C.danger}80` }}>
                    CONFLICT
                  </span>
                )}
              </div>

              {/* Teams */}
              <div className="divide-y" style={{ borderColor: `${C.accent}06` }}>
                {teams.map((t) => {
                  const isConflict = isConflictTeam(conflicts, player, t.team);
                  const isSelected = selected?.player === player && selected?.team === t.team;

                  return (
                    <button
                      key={t.team}
                      onClick={() => handleSelect(player, t.team)}
                      className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left transition-all duration-200"
                      style={{
                        background: isSelected
                          ? `${C.accent}15`
                          : isConflict
                            ? `${C.danger}06`
                            : 'transparent',
                        borderLeft: isSelected
                          ? `3px solid ${C.accent}`
                          : isConflict
                            ? `3px solid ${C.danger}40`
                            : '3px solid transparent',
                      }}>
                      <Image
                        src={flagUrl(t.team, 80)}
                        alt={t.team}
                        width={28}
                        height={18}
                        className="rounded"
                        style={{
                          ...FLAG_STYLE,
                          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div
                          className="text-[13px] font-semibold"
                          style={{ color: isConflict ? C.danger : '#fbfbfb' }}>
                          {t.team}
                        </div>
                        <div
                          className="font-heading text-[9px] font-bold uppercase tracking-[2px]"
                          style={{ color: `${C.accent}30` }}>
                          GROUP {t.group}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lock button */}
      <div className="mt-10 text-center md:mt-14">
        <button
          onClick={onLock}
          className="font-heading cursor-pointer rounded-full px-10 py-4 text-sm font-bold uppercase tracking-[4px] transition-all duration-300 hover:scale-105 md:px-14 md:py-5"
          style={{
            background: totalConflicts === 0 ? `${C.accent}15` : `${C.accent}06`,
            border: `2px solid ${totalConflicts === 0 ? `${C.accent}40` : `${C.accent}15`}`,
            color: totalConflicts === 0 ? C.accent : `${C.accent}40`,
            boxShadow: totalConflicts === 0 ? `0 0 30px ${C.accent}15` : 'none',
          }}>
          {totalConflicts > 0 ? 'LOCK IN ANYWAY' : 'LOCK IN ASSIGNMENTS'}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Phase: LOCKED — Draft complete
   ═══════════════════════════════════════════════════════════ */

function LockedScreen({ state }: { state: DraftState }) {
  const players = [...new Set(state.assignments.map((a) => a.player))];

  return (
    <div className="min-h-[100svh] px-4 pt-20 pb-10 md:px-8 md:pt-24">
      <div className="mb-10 text-center md:mb-14">
        <div
          className="font-display tracking-[-0.02em]"
          style={{ fontSize: 'clamp(40px, 10vw, 80px)', color: C.accent }}>
          DRAFT LOCKED
        </div>
        <div
          className="font-heading mt-3 text-xs font-semibold uppercase tracking-[5px] md:text-sm"
          style={{ color: `${C.accent}35` }}>
          ASSIGNMENTS ARE FINAL
        </div>
      </div>

      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 md:gap-4">
        {players.map((player) => {
          const teams = getPlayerTeams(state.assignments, player);
          return (
            <div
              key={player}
              className="overflow-hidden rounded-xl md:rounded-2xl"
              style={{ background: C.card, border: `1.5px solid ${C.accent}10` }}>
              <div
                className="px-4 py-3"
                style={{ borderBottom: `1px solid ${C.accent}08`, background: `${C.accent}04` }}>
                <span className="font-heading text-sm font-bold" style={{ color: C.accent }}>
                  {player}
                </span>
              </div>
              <div className="p-3">
                <div className="flex flex-wrap gap-2">
                  {teams.map((t) => (
                    <div
                      key={t.team}
                      className="flex items-center gap-1.5 rounded px-2 py-1"
                      style={{ background: `${C.accent}08`, border: `1px solid ${C.accent}10` }}>
                      <Image
                        src={flagUrl(t.team, 40)}
                        alt={t.team}
                        width={18}
                        height={12}
                        className="rounded-sm"
                        style={FLAG_STYLE}
                      />
                      <span
                        className="text-[11px] font-semibold"
                        style={{ color: `${C.accent}80` }}>
                        {t.team}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-10 text-center">
        <Link
          href="/"
          className="font-heading inline-block rounded-full px-8 py-3 text-sm font-bold uppercase tracking-[3px] transition-all duration-300 hover:scale-105"
          style={{
            background: `${C.accent}12`,
            border: `1.5px solid ${C.accent}25`,
            color: C.accent,
          }}>
          GO TO SWEEPSTAKE →
        </Link>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main DraftClient
   ═══════════════════════════════════════════════════════════ */

export default function DraftClient() {
  const [state, setState] = useState<DraftState | null>(null);
  const [loading, setLoading] = useState(true);
  const [roundTransition, setRoundTransition] = useState(false);
  const roundTransitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingStateRef = useRef<DraftState | null>(null);
  const pendingRoundTransitionRef = useRef(false);

  // Fetch state on mount
  useEffect(() => {
    api().then((s) => {
      setState(s);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (roundTransitionTimer.current) {
        clearTimeout(roundTransitionTimer.current);
      }
    };
  }, []);

  const triggerRoundTransition = useCallback(() => {
    setRoundTransition(true);
    if (roundTransitionTimer.current) {
      clearTimeout(roundTransitionTimer.current);
    }
    roundTransitionTimer.current = setTimeout(() => {
      setRoundTransition(false);
    }, 2500);
  }, []);

  const handleStart = useCallback(async () => {
    const s = await api('start');
    setState(s);
  }, []);

  const handleDraw = useCallback(async (): Promise<Assignment | null> => {
    const prevRound = state?.currentRound ?? 0;
    const prevStatus = state?.status;
    const s = await api('draw');
    pendingStateRef.current = s;
    if (prevStatus === 'drafting' && s.status === 'drafting' && s.currentRound > prevRound) {
      pendingRoundTransitionRef.current = true;
    }
    return (s as DraftState & { lastDrawn?: Assignment }).lastDrawn || null;
  }, [state]);

  const commitPendingDraw = useCallback(() => {
    if (pendingStateRef.current) {
      setState(pendingStateRef.current);
      pendingStateRef.current = null;
    }
    if (pendingRoundTransitionRef.current) {
      pendingRoundTransitionRef.current = false;
      triggerRoundTransition();
    }
  }, [triggerRoundTransition]);

  const handleTrade = useCallback(async (p1: string, t1: string, p2: string, t2: string) => {
    const s = await api('trade', { player1: p1, team1: t1, player2: p2, team2: t2 });
    setState(s);
  }, []);

  const handleLock = useCallback(async () => {
    if (!confirm('Lock in all assignments? This cannot be undone.')) return;
    const s = await api('lock');
    setState(s);
  }, []);

  if (loading || !state) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center" style={{ background: C.bg }}>
        <div className="draft-orb draft-orb--pulse" />
      </div>
    );
  }

  return (
    <div
      className="relative min-h-[100svh]"
      style={{
        background: C.bg,
        color: '#fbfbfb',
        fontFamily: "'DM Sans', sans-serif",
      }}>
      {/* Reset button — top right corner for testing */}
      {state.status !== 'locked' && (
        <button
          onClick={async () => {
            if (!confirm('Reset the entire draft?')) return;
            const s = await api('reset');
            setState(s);
          }}
          className="font-heading fixed top-4 right-4 z-50 rounded-lg px-3 py-1.5 text-[9px] font-bold uppercase tracking-[2px] opacity-30 transition-opacity hover:opacity-80"
          style={{
            background: `${C.accent}10`,
            color: C.accent,
            border: `1px solid ${C.accent}15`,
          }}>
          RESET
        </button>
      )}

      {state.status === 'pending' && <IntroScreen onStart={handleStart} />}
      {state.status === 'drafting' && (
        <DraftCeremony
          state={state}
          onDraw={handleDraw}
          roundTransition={roundTransition}
          onCommitDraw={commitPendingDraw}
        />
      )}
      {state.status === 'trading' && (
        <TradingFloor state={state} onTrade={handleTrade} onLock={handleLock} />
      )}
      {state.status === 'locked' && <LockedScreen state={state} />}
    </div>
  );
}
