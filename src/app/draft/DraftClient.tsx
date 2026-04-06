'use client';

import { Flag } from '@/components/ui/Flag';
import { COUNTRY_CODES } from '@/data/countryCodes';
import Link from 'next/link';
import type { CSSProperties } from 'react';
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

type DrawPhase =
  | 'idle'
  | 'spinning'
  | 'charging'
  | 'decelerating'
  | 'wobbling'
  | 'locking'
  | 'revealing'
  | 'dealt';

/* ═══════════════════════════════════════════════════════════
   Constants & helpers
   ═══════════════════════════════════════════════════════════ */

const C = {
  bg: '#030d10',
  accent: '#94FFE4',
  accent2: '#06D6A0',
  card: '#071418',
  danger: '#FF6B6B',
  gold: '#FFD60A',
};

const FLAG_WIDTHS = [20, 40, 80, 160, 320, 640, 1280] as const;

function supportedFlagWidth(size: number): number {
  return FLAG_WIDTHS.find((width) => size <= width) ?? FLAG_WIDTHS[FLAG_WIDTHS.length - 1];
}

function flagUrl(team: string, size = 80): string {
  const code = COUNTRY_CODES[team] || '';
  return `https://flagcdn.com/w${supportedFlagWidth(size)}/${code}.png`;
}

function DraftFlag({
  team,
  width,
  height,
  size = 160,
  fit = 'contain',
  className,
  style,
}: {
  team: string;
  width: number;
  height: number;
  size?: number;
  fit?: CSSProperties['objectFit'];
  className?: string;
  style?: CSSProperties;
}) {
  const code = COUNTRY_CODES[team];
  const src = flagUrl(team, size);
  const src2x = flagUrl(team, size * 2);

  if (!code) {
    return (
      <span
        className={className}
        style={{
          width,
          height,
          display: 'block',
          borderRadius: 8,
          background: 'rgba(255,255,255,0.08)',
          ...style,
        }}
      />
    );
  }

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      srcSet={src2x !== src ? `${src2x} 2x` : undefined}
      alt={team}
      loading="lazy"
      className={className}
      style={{
        width,
        height,
        display: 'block',
        objectFit: fit,
        ...style,
      }}
    />
  );
}

function getPlayerTeams(assignments: Assignment[], player: string) {
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

/** Deterministic hue derived from team name */
function teamHue(team: string): number {
  let h = 0;
  for (let i = 0; i < team.length; i++) h = (h * 31 + team.charCodeAt(i)) & 0xffff;
  return h % 360;
}

/* ═══════════════════════════════════════════════════════════
   API
   ═══════════════════════════════════════════════════════════ */

async function api(action?: string, params?: Record<string, string>): Promise<DraftState> {
  if (!action) return fetch('/api/draft').then((r) => r.json());
  return fetch('/api/draft', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...params }),
  }).then((r) => r.json());
}

/* ═══════════════════════════════════════════════════════════
   BurstParticles
   ═══════════════════════════════════════════════════════════ */

function BurstParticles({
  active,
  seed,
  hue = 160,
}: {
  active: boolean;
  seed: number;
  hue?: number;
}) {
  if (!active) return null;
  const rand = mulberry32(seed);
  const palette = [
    `hsl(${hue} 100% 65%)`,
    `hsl(${(hue + 120) % 360} 100% 65%)`,
    `hsl(${(hue + 240) % 360} 100% 65%)`,
    '#fff',
    C.gold,
    C.accent,
  ];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible">
      {Array.from({ length: 32 }, (_, i) => {
        const angle = (i / 32) * 360 + rand() * 11;
        const dist = 80 + rand() * 180;
        const px = Math.cos((angle * Math.PI) / 180) * dist;
        const py = Math.sin((angle * Math.PI) / 180) * dist;
        const size = 4 + rand() * 10;
        const color = palette[Math.floor(rand() * palette.length)];
        return (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 rounded-full"
            style={{
              width: size,
              height: size,
              background: color,
              marginLeft: -size / 2,
              marginTop: -size / 2,
              animation: `particle-fly ${0.5 + rand() * 0.7}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
              animationDelay: `${i * 0.012}s`,
              ['--px' as string]: `${px}px`,
              ['--py' as string]: `${py}px`,
            }}
          />
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   RevealOverlay — full-screen reveal
   ═══════════════════════════════════════════════════════════ */

function RevealOverlay({
  assignment,
  active,
  burstSeed,
}: {
  assignment: Assignment | null;
  active: boolean;
  burstSeed: number;
}) {
  if (!active || !assignment) return null;
  const hue = teamHue(assignment.team);

  return (
    <div className="reveal-overlay">
      <div
        className="reveal-overlay__bg"
        style={{
          background: `radial-gradient(ellipse 90% 70% at 50% 40%,
            hsl(${hue} 74% 18%) 0%,
            hsl(${hue} 48% 10%) 45%,
            ${C.bg} 80%)`,
        }}
      />
      <div
        className="reveal-overlay__beam"
        style={{
          background: `conic-gradient(
            from 120deg at 50% 50%,
            transparent 0deg,
            hsl(${hue} 100% 64% / 0.1) 70deg,
            transparent 160deg,
            hsl(${(hue + 140) % 360} 100% 64% / 0.08) 250deg,
            transparent 360deg
          )`,
        }}
      />
      <div className="reveal-overlay__content">
        <div className="reveal-overlay__eyebrow">Now Drawn For</div>
        <div className="reveal-overlay__player">{assignment.player}</div>
        <div className="reveal-overlay__flag-wrap">
          <div
            className="reveal-overlay__flag-glow"
            style={{
              background: `radial-gradient(circle, hsl(${hue} 100% 58%) 0%, transparent 65%)`,
            }}
          />
          <DraftFlag
            team={assignment.team}
            width={240}
            height={160}
            size={512}
            fit="cover"
            className="reveal-overlay__flag"
          />
          <BurstParticles active hue={hue} seed={burstSeed} />
        </div>
        <div className="reveal-overlay__team" style={{ color: `hsl(${hue} 90% 80%)` }}>
          {assignment.team}
        </div>
        <div className="reveal-overlay__group">Group {assignment.group}</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   IntroScreen
   ═══════════════════════════════════════════════════════════ */

function IntroScreen({ onStart }: { onStart: () => void }) {
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div className="draft-arena">
        <div className="draft-mesh" />
        <div className="draft-aurora" />
        <div className="draft-confetti" />
      </div>

      <div
        className="font-display relative z-10"
        style={{
          fontSize: 'clamp(80px, 22vw, 210px)',
          lineHeight: 0.82,
          WebkitTextStroke: `2px ${C.accent}`,
          WebkitTextFillColor: 'transparent',
          opacity: entered ? 1 : 0,
          transform: entered ? 'translateY(0) scale(1)' : 'translateY(60px) scale(0.9)',
          transition: 'all 1.4s cubic-bezier(0.19, 1, 0.22, 1)',
          filter: `drop-shadow(0 0 80px ${C.accent}25)`,
          letterSpacing: '-0.03em',
        }}>
        THE
        <br />
        DRAFT
      </div>

      <div
        className="font-heading relative z-10 mt-6 text-[11px] font-semibold uppercase tracking-[8px] md:text-sm"
        style={{
          color: `${C.accent}55`,
          opacity: entered ? 1 : 0,
          transform: entered ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 1s cubic-bezier(0.19, 1, 0.22, 1) 0.35s',
        }}>
        48 NATIONS · 12 PLAYERS · 4 ROUNDS
      </div>

      <div
        className="relative z-10 mx-auto mt-10 md:mt-14"
        style={{
          width: 80,
          height: 80,
          opacity: entered ? 1 : 0,
          transition: 'opacity 1.2s ease 0.7s',
        }}>
        <div className="draft-orb draft-orb--pulse" style={{ width: '100%', height: '100%' }} />
      </div>

      <button
        onClick={onStart}
        className="font-heading relative z-10 mt-10 cursor-pointer rounded-full px-12 py-5 text-sm font-bold uppercase tracking-[5px] transition-all duration-500 hover:scale-105 md:mt-14"
        style={{
          background: `linear-gradient(135deg, ${C.accent}16, ${C.accent2}14)`,
          border: `2px solid ${C.accent}45`,
          color: C.accent,
          opacity: entered ? 1 : 0,
          transform: entered ? 'translateY(0)' : 'translateY(24px)',
          transition:
            'all 1s cubic-bezier(0.19, 1, 0.22, 1) 0.9s, box-shadow 0.3s ease, transform 0.3s ease',
          boxShadow: `0 0 60px ${C.accent}1a, inset 0 0 30px ${C.accent}08`,
        }}>
        BEGIN THE DRAFT
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   DraftCeremony — Card Roulette
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
  const [reelSeed, setReelSeed] = useState(42);

  // Timer-controlled cycling index
  const [teaseIdx, setTeaseIdx] = useState(0);
  const teaseIdxRef = useRef(0);
  const cycleRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const decelRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Stable tease list captured at draw start
  const teaseTeamsRef = useRef<string[]>([]);

  const currentPlayer = state.playerOrder[state.currentPick] || '';
  const isActive = drawPhase !== 'idle' && drawPhase !== 'dealt';
  const showReveal = drawPhase === 'revealing' || drawPhase === 'dealt';

  // Build tease list for display (12 shuffled teams)
  const teaseTeams = useMemo(() => {
    return shuffleWithSeed(state.availableTeams, reelSeed).slice(0, 12);
  }, [state.availableTeams, reelSeed]);

  // Get team at offset from current center
  const getTeamAt = useCallback(
    (offset: number) => {
      const list = teaseTeamsRef.current.length > 0 ? teaseTeamsRef.current : teaseTeams;
      const len = list.length;
      if (len === 0) return '';
      return list[(teaseIdx + offset + len * 100) % len];
    },
    [teaseIdx, teaseTeams]
  );

  // Cleanup
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      if (cycleRef.current) clearInterval(cycleRef.current);
      if (decelRef.current) clearTimeout(decelRef.current);
      timers.forEach(clearTimeout);
    };
  }, []);

  const advanceTease = useCallback(() => {
    const len = teaseTeamsRef.current.length || 12;
    teaseIdxRef.current = (teaseIdxRef.current + 1) % len;
    setTeaseIdx(teaseIdxRef.current);
  }, []);

  const setTease = useCallback((idx: number) => {
    teaseIdxRef.current = idx;
    setTeaseIdx(idx);
  }, []);

  function after(ms: number, fn: () => void) {
    const t = setTimeout(fn, ms);
    timersRef.current.push(t);
    return t;
  }

  /* ── The draw handler ─────────────────────────────────────── */

  const handleDraw = async () => {
    if (drawPhase !== 'idle') return;

    // New shuffle for this draw
    setReelSeed((s) => s + 1);
    const newTeaseList = shuffleWithSeed(state.availableTeams, reelSeed + 1).slice(0, 12);
    teaseTeamsRef.current = newTeaseList;
    setTease(0);

    // ── Phase 1: Fast spinning ──────────────────────────────
    setDrawPhase('spinning');
    cycleRef.current = setInterval(advanceTease, 45);

    after(1800, () => {
      // ── Phase 2: Charging (API fires here) ─────────────────
      setDrawPhase('charging');

      after(600, async () => {
        const drawn = await onDraw();
        if (!drawn) return;

        setRevealed(drawn);

        // Ensure drawn team is in the tease list
        let targetPos = teaseTeamsRef.current.indexOf(drawn.team);
        if (targetPos < 0) {
          teaseTeamsRef.current[0] = drawn.team;
          targetPos = 0;
        }

        // ── Phase 3: Decelerating (roulette slowdown) ────────
        setDrawPhase('decelerating');

        // Stop the fast interval
        if (cycleRef.current) {
          clearInterval(cycleRef.current);
          cycleRef.current = null;
        }

        // Calculate how many ticks to reach target
        const len = teaseTeamsRef.current.length;
        const currentPos = teaseIdxRef.current % len;
        let ticksToGo = (targetPos - currentPos + len) % len;
        const minTicks = 10;
        while (ticksToGo < minTicks) ticksToGo += len;

        // Build deceleration intervals: 55ms → 650ms, cubic easing
        const intervals: number[] = [];
        for (let i = 0; i < ticksToGo; i++) {
          const t = i / Math.max(ticksToGo - 1, 1);
          intervals.push(55 + t ** 3 * 595);
        }

        let step = 0;
        const decelTick = () => {
          advanceTease();
          step++;

          if (step >= ticksToGo) {
            // ── Landed on target! Start wobble ──────────────
            after(300, () => {
              setDrawPhase('wobbling');

              after(220, () => {
                setTease(targetPos);

                after(280, () => {
                  // ── Phase 4: Lock ──────────────────────────
                  setBurstSeed((s) => s + 1);
                  setDrawPhase('locking');

                  after(550, () => {
                    // ── Phase 5: Full-screen reveal ──────────
                    setDrawPhase('revealing');

                    after(3200, () => {
                      // ── Phase 6: Dealt ─────────────────────
                      setDrawPhase('dealt');
                      onCommitDraw();

                      after(900, () => {
                        setDrawPhase('idle');
                        setRevealed(null);
                      });
                    });
                  });
                });
              });
            });
            return;
          }

          decelRef.current = setTimeout(decelTick, intervals[step] || 650);
        };

        decelRef.current = setTimeout(decelTick, intervals[0]);
      });
    });
  };

  // ── Round transition overlay ──────────────────────────────
  if (roundTransition) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center text-center">
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

  if (state.status === 'trading') {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center text-center">
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

  /* ── Card fan data ───────────────────────────────────────── */
  const offsets = [-2, -1, 0, 1, 2];
  const showCards = isActive;
  const centerTeam = getTeamAt(0);
  const centerHue = teamHue(centerTeam || 'x');
  const stageHue = teamHue(revealed?.team || centerTeam || 'x');
  const stageHot =
    drawPhase === 'spinning' ||
    drawPhase === 'charging' ||
    drawPhase === 'decelerating' ||
    drawPhase === 'locking';

  return (
    <div className="relative flex h-svh items-center justify-center overflow-hidden px-3 py-3 md:px-5 md:py-5">
      {/* Arena bg */}
      <div className="draft-arena">
        <div className="draft-mesh" />
        <div className="draft-confetti" />
        <div className="draft-aurora" />
        <div className={`draft-vignette ${stageHot ? 'is-active' : ''}`} />
      </div>

      <div className="draft-ceremony relative z-10 w-full max-w-6xl">
        <div className="draft-ceremony__shell draft-ceremony__shell--screen">
          <div className="draft-ceremony__topline">
            <div className="draft-ceremony__chip">Round {state.currentRound + 1} of 4</div>
            <div className="draft-ceremony__chip">
              Pick {state.currentPick + 1} of {state.playerOrder.length}
            </div>
            <div className="draft-ceremony__chip">{state.availableTeams.length} teams live</div>
          </div>
          <div className="draft-ceremony__header">
            <div className="draft-ceremony__eyebrow">Current Drawer</div>
            <div
              className="font-display draft-ceremony__player"
              style={{
                color: C.accent,
                textShadow: `0 0 36px ${C.accent}2b`,
              }}>
              {currentPlayer}
            </div>

            <div className="draft-ceremony__status">
              {drawPhase === 'idle' && (
                <div
                  className="font-heading text-[10px] font-semibold uppercase tracking-[4px]"
                  style={{
                    color: `${C.accent}40`,
                    animation: 'draft-fade-pulse 2s ease-in-out infinite',
                  }}>
                  Tap to spin
                </div>
              )}
              {(drawPhase === 'spinning' || drawPhase === 'charging') && (
                <div className="draft-suspense is-active" style={{ position: 'relative' }}>
                  <div className="draft-suspense__label">Drawing...</div>
                  <div className="draft-suspense__meter">
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              )}
              {drawPhase === 'decelerating' && (
                <div
                  className="font-heading text-[10px] font-semibold uppercase tracking-[4px]"
                  style={{ color: `${C.gold}92` }}>
                  Slowing down...
                </div>
              )}
              {drawPhase === 'wobbling' && (
                <div
                  className="font-heading text-[10px] font-bold uppercase tracking-[4px]"
                  style={{
                    color: '#fff',
                    animation: 'draft-fade-pulse 0.3s ease-in-out infinite',
                  }}>
                  ...
                </div>
              )}
              {drawPhase === 'locking' && (
                <div
                  className="font-heading text-[10px] font-bold uppercase tracking-[4px]"
                  style={{ color: C.accent }}>
                  Locked in
                </div>
              )}
              {showReveal && revealed && (
                <div
                  className="font-heading text-[10px] font-semibold uppercase tracking-[4px]"
                  style={{ color: `${C.accent}50` }}>
                  Reveal complete
                </div>
              )}
            </div>
          </div>

          <div
            className={`draft-ceremony__stage ${drawPhase === 'idle' ? 'is-idle' : ''}`}
            onClick={handleDraw}
            style={{
              cursor: drawPhase === 'idle' ? 'pointer' : 'default',
              ['--stage-hue' as string]: `${stageHue}`,
            }}>
            <div className="draft-ceremony__stage-bg" />
            <div className={`draft-ceremony__stage-glow ${stageHot ? 'is-live' : ''}`} />
            <div className="draft-ceremony__stage-edge" />

            <div className="roulette-stage relative z-10">
              {!showCards && (
                <div className="draft-idol" style={{ margin: '0 auto' }}>
                  <div className="draft-idol__glow" />
                  <div className="draft-idol__pitch" />
                  <div className="draft-idol__ball">
                    <div className="draft-idol__ball-core" />
                    <div className="draft-idol__ball-panel draft-idol__ball-panel--center" />
                    <div className="draft-idol__ball-panel draft-idol__ball-panel--top" />
                    <div className="draft-idol__ball-panel draft-idol__ball-panel--left" />
                    <div className="draft-idol__ball-panel draft-idol__ball-panel--right" />
                    <div className="draft-idol__ball-panel draft-idol__ball-panel--bottom" />
                  </div>
                </div>
              )}

              {showCards &&
                offsets.map((offset) => {
                  const team = getTeamAt(offset);
                  const hue = teamHue(team || 'x');
                  const isCenter = offset === 0;
                  const isWobbling = isCenter && drawPhase === 'wobbling';
                  const isLocking = isCenter && drawPhase === 'locking';

                  return (
                    <div
                      key={offset}
                      className={[
                        'roulette-card',
                        `roulette-card--${offset < 0 ? 'n' : ''}${Math.abs(offset)}`,
                        isWobbling ? 'is-wobbling' : '',
                        isLocking ? 'is-locked' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      style={{
                        ['--hue' as string]: hue,
                        background: `linear-gradient(135deg,
                          hsl(${hue} 76% 20%) 0%,
                          hsl(${(hue + 42) % 360} 48% 11%) 52%,
                          rgba(7, 20, 24, 0.96) 100%)`,
                        border: `1px solid ${
                          isCenter ? `hsl(${hue} 78% 62% / 0.42)` : 'rgba(255,255,255,0.05)'
                        }`,
                        boxShadow: isCenter
                          ? `0 0 42px hsl(${hue} 78% 44% / 0.26),
                             0 22px 42px rgba(0,0,0,0.5),
                             inset 0 1px 0 rgba(255,255,255,0.08)`
                          : '0 10px 28px rgba(0,0,0,0.38)',
                      }}>
                      {isCenter && <div className="roulette-card__glow" />}

                      <div className="roulette-card__content">
                        {Math.abs(offset) <= 1 && team && (
                          <Flag team={team} size={isCenter ? 44 : 26} />
                        )}

                        {isCenter && (
                          <div className="roulette-card__info">
                            <div
                              className="roulette-card__name"
                              style={{ color: `hsl(${hue} 96% 86%)` }}>
                              {team}
                            </div>
                            <div className="roulette-card__group">
                              {revealed && (drawPhase === 'locking' || showReveal)
                                ? `Group ${revealed.group}`
                                : 'Live draw'}
                            </div>
                          </div>
                        )}

                        {Math.abs(offset) === 1 && team && (
                          <span className="roulette-card__hint">
                            {team.slice(0, 3).toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

              {drawPhase === 'locking' && (
                <BurstParticles active seed={burstSeed} hue={centerHue} />
              )}
            </div>
          </div>

          <div className="draft-ceremony__actions">
            {drawPhase === 'idle' ? (
              <button
                onClick={handleDraw}
                className="font-heading relative z-10 cursor-pointer rounded-full px-8 py-3 text-[11px] font-bold uppercase tracking-[4px] transition-all duration-500 hover:scale-105 md:px-10 md:py-3.5 md:text-xs"
                style={{
                  background: `linear-gradient(135deg, ${C.accent}18, rgba(255, 214, 10, 0.14))`,
                  border: `1.5px solid ${C.accent}40`,
                  color: C.accent,
                  boxShadow: `0 0 36px ${C.accent}18`,
                }}>
                Spin the wheel
              </button>
            ) : (
              <div className="draft-ceremony__actions-spacer" />
            )}
          </div>

          <div className="draft-roster">
            <div className="draft-roster__header">
              <span className="draft-roster__title">Board</span>
              <span className="draft-roster__caption">Assigned teams update live</span>
            </div>

            <div className="grid grid-cols-3 gap-2 md:grid-cols-4 md:gap-2">
              {state.playerOrder.map((name, i) => {
                const teams = getPlayerTeams(state.assignments, name);
                const isCurrent = i === state.currentPick;
                const isDone = i < state.currentPick;
                return (
                  <div
                    key={name}
                    className="draft-roster__card"
                    style={{
                      background: isCurrent ? `${C.accent}12` : 'rgba(255,255,255,0.03)',
                      border: isCurrent
                        ? `1.5px solid ${C.accent}35`
                        : '1px solid rgba(255,255,255,0.06)',
                      opacity: isDone ? 0.52 : 1,
                      boxShadow: isCurrent ? `0 0 26px ${C.accent}12` : 'none',
                    }}>
                    <div
                      className="font-heading text-[10px] font-bold md:text-[11px]"
                      style={{ color: isCurrent ? C.accent : `${C.accent}68` }}>
                      {name}
                    </div>
                    <div className="draft-roster__flags">
                      {teams.map((t) => (
                        <Flag key={t.team} team={t.team} size={16} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <RevealOverlay assignment={revealed} active={showReveal} burstSeed={burstSeed} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TradingFloor
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
    if (selected.player === player && selected.team === team) {
      setSelected(null);
      return;
    }
    if (selected.player === player) {
      setSelected({ player, team });
      return;
    }
    onTrade(selected.player, selected.team, player, team);
    setSelected(null);
  };

  const players = [...new Set(state.assignments.map((a) => a.player))];

  return (
    <div className="min-h-svh px-4 pt-20 pb-10 md:px-8 md:pt-24">
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
                      <Flag team={t.team} size={28} />
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
   LockedScreen
   ═══════════════════════════════════════════════════════════ */

function LockedScreen({ state }: { state: DraftState }) {
  const players = [...new Set(state.assignments.map((a) => a.player))];

  return (
    <div className="min-h-svh px-4 pt-20 pb-10 md:px-8 md:pt-24">
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
                      <Flag team={t.team} size={18} />
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

  useEffect(() => {
    api().then((s) => {
      setState(s);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (roundTransitionTimer.current) clearTimeout(roundTransitionTimer.current);
    };
  }, []);

  const triggerRoundTransition = useCallback(() => {
    setRoundTransition(true);
    if (roundTransitionTimer.current) clearTimeout(roundTransitionTimer.current);
    roundTransitionTimer.current = setTimeout(() => setRoundTransition(false), 2500);
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
      <div className="flex min-h-svh items-center justify-center" style={{ background: C.bg }}>
        <div className="draft-orb draft-orb--pulse" />
      </div>
    );
  }

  return (
    <div
      className="relative min-h-svh"
      style={{ background: C.bg, color: '#fbfbfb', fontFamily: "'DM Sans', sans-serif" }}>
      {state.status !== 'locked' && (
        <button
          onClick={async () => {
            if (!confirm('Reset the entire draft?')) return;
            const s = await api('reset');
            setState(s);
          }}
          className="font-heading fixed top-4 right-4 z-50 rounded-lg px-3 py-1.5 text-[9px] font-bold uppercase tracking-[2px] opacity-20 transition-opacity hover:opacity-80"
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
