'use client';

import { Flag } from '@/components/ui/Flag';
import { COUNTRY_CODES } from '@/data/countryCodes';
import Link from 'next/link';
import type { CSSProperties, TransitionEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

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

type DrawPhase = 'idle' | 'spinning' | 'locking' | 'revealing' | 'dealt';

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
   ConfettiBurst — full-screen celebration particles
   ═══════════════════════════════════════════════════════════ */

function ConfettiBurst({
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
    `hsl(${hue} 100% 68%)`,
    `hsl(${(hue + 90) % 360} 100% 68%)`,
    `hsl(${(hue + 180) % 360} 100% 68%)`,
    `hsl(${(hue + 270) % 360} 100% 68%)`,
    '#fff',
    C.gold,
    C.accent,
    '#FF6EC7',
  ];

  return (
    <div className="pointer-events-none fixed inset-0 z-[70] overflow-hidden">
      {Array.from({ length: 60 }, (_, i) => {
        const angle = (i / 60) * 360 + rand() * 20;
        const dist = 120 + rand() * 400;
        const px = Math.cos((angle * Math.PI) / 180) * dist;
        const py = Math.sin((angle * Math.PI) / 180) * dist - 100;
        const size = 4 + rand() * 12;
        const color = palette[Math.floor(rand() * palette.length)];
        const isRect = rand() > 0.5;
        return (
          <div
            key={i}
            className="absolute left-1/2 top-1/2"
            style={{
              width: isRect ? size * 2.5 : size,
              height: size,
              background: color,
              borderRadius: isRect ? '2px' : '50%',
              marginLeft: -size / 2,
              marginTop: -size / 2,
              animation: `confetti-burst ${0.6 + rand() * 0.8}s cubic-bezier(0.22, 0.61, 0.36, 1) forwards`,
              animationDelay: `${i * 0.01}s`,
              ['--cx' as string]: `${px}px`,
              ['--cy' as string]: `${py}px`,
              ['--rot' as string]: `${rand() * 720 - 360}deg`,
            }}
          />
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   RevealOverlay — cinematic full-screen reveal
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
    <>
      <div className="reveal-flash" />
      <div className="reveal-overlay" style={{ ['--reveal-hue' as string]: hue }}>
        <div
          className="reveal-overlay__bg"
          style={{
            background: `radial-gradient(ellipse 100% 80% at 50% 35%,
              hsl(${hue} 80% 20%) 0%,
              hsl(${hue} 50% 10%) 40%,
              ${C.bg} 75%)`,
          }}
        />
        <div
          className="reveal-overlay__beam"
          style={{
            background: `conic-gradient(
              from 140deg at 50% 50%,
              transparent 0deg,
              hsl(${hue} 100% 64% / 0.12) 60deg,
              transparent 140deg,
              hsl(${(hue + 140) % 360} 100% 64% / 0.08) 240deg,
              transparent 360deg
            )`,
          }}
        />
        <div className="reveal-overlay__content">
          <div className="reveal-overlay__eyebrow">Drawn For</div>
          <div className="reveal-overlay__player">{assignment.player}</div>
          <div className="reveal-overlay__flag-wrap">
            <div
              className="reveal-overlay__flag-glow"
              style={{
                background: `radial-gradient(circle, hsl(${hue} 100% 55%) 0%, transparent 60%)`,
              }}
            />
            <DraftFlag
              team={assignment.team}
              width={300}
              height={195}
              size={640}
              fit="cover"
              className="reveal-overlay__flag"
              style={{ width: '100%', height: '100%', borderRadius: '20px' }}
            />
          </div>
          <div className="reveal-overlay__team" style={{ color: `hsl(${hue} 90% 78%)` }}>
            {assignment.team}
          </div>
          <div className="reveal-overlay__group">Group {assignment.group}</div>
        </div>
        <ConfettiBurst active hue={hue} seed={burstSeed} />
      </div>
    </>
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
   DraftCeremony — Full-Screen Draw Experience
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
  const [reelTeams, setReelTeams] = useState<string[]>([]);
  const [stripOffset, setStripOffset] = useState(0);
  const [phase2Trigger, setPhase2Trigger] = useState(false);

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const REEL_LENGTH = 42;
  const WINNER_SLOT = 36;

  const currentPlayer = state.playerOrder[state.currentPick] || '';
  const isActive = drawPhase !== 'idle' && drawPhase !== 'dealt';
  const showReveal = drawPhase === 'revealing' || drawPhase === 'dealt';
  const stageHue = teamHue(revealed?.team || 'x');
  const stageHot = drawPhase === 'spinning' || drawPhase === 'locking';

  /* ── Flag preloading ────────────────────────────────────── */
  useEffect(() => {
    state.availableTeams.forEach((team) => {
      const img = new Image();
      img.src = flagUrl(team, 640);
    });
  }, [state.availableTeams]);

  /* ── Cleanup ─────────────────────────────────────────────── */
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(clearTimeout);
    };
  }, []);

  function after(ms: number, fn: () => void) {
    const t = setTimeout(fn, ms);
    timersRef.current.push(t);
    return t;
  }

  /* ── The draw handler ─────────────────────────────────────── */
  const handleDraw = async () => {
    if (drawPhase !== 'idle') return;

    // Resolve the winner upfront so we can plant it inside the reel
    const drawn = await onDraw();
    if (!drawn) return;
    setRevealed(drawn);

    // Build the reel: shuffled fillers with the winner planted at WINNER_SLOT
    const fillerSeed = (Date.now() & 0xffff) ^ (state.currentPick * 7919);
    const shuffled = shuffleWithSeed(state.availableTeams, fillerSeed);
    const reel: string[] = [];
    for (let i = 0; i < REEL_LENGTH; i++) {
      reel.push(shuffled[i % shuffled.length] || drawn.team);
    }
    reel[WINNER_SLOT] = drawn.team;
    // Avoid the winner appearing immediately adjacent to itself
    if (reel[WINNER_SLOT - 1] === drawn.team) {
      reel[WINNER_SLOT - 1] =
        shuffled[(WINNER_SLOT + 17) % shuffled.length] || reel[WINNER_SLOT - 1];
    }
    if (reel[WINNER_SLOT + 1] === drawn.team) {
      reel[WINNER_SLOT + 1] =
        shuffled[(WINNER_SLOT + 23) % shuffled.length] || reel[WINNER_SLOT + 1];
    }

    setReelTeams(reel);
    setStripOffset(0);
    setPhase2Trigger(false);
    setDrawPhase('spinning');

    // Two RAFs guarantee the initial transform paints before we kick off the transition
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const isDesktop =
          typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches;
        const cardHeight = isDesktop ? 140 : 110;
        // Center the winner card inside the 3-card window
        const targetOffset = -(WINNER_SLOT - 1) * cardHeight;
        setStripOffset(targetOffset);
        setPhase2Trigger(true);
      });
    });
  };

  const handleStripTransitionEnd = (e: TransitionEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.propertyName !== 'transform') return;
    if (drawPhase !== 'spinning') return;

    setBurstSeed((s) => s + 1);
    setDrawPhase('locking');

    after(750, () => {
      setDrawPhase('revealing');

      after(3400, () => {
        setDrawPhase('dealt');
        onCommitDraw();

        after(900, () => {
          setDrawPhase('idle');
          setRevealed(null);
          setReelTeams([]);
          setStripOffset(0);
          setPhase2Trigger(false);
        });
      });
    });
  };

  // Round transition overlay
  if (roundTransition) {
    return (
      <div className="draw-exp draw-exp--center">
        <div className="draft-arena">
          <div className="draft-mesh" />
          <div className="draft-aurora" />
        </div>
        <div className="relative z-10 text-center">
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
      </div>
    );
  }

  if (state.status === 'trading') {
    return (
      <div className="draw-exp draw-exp--center">
        <div className="draft-arena">
          <div className="draft-mesh" />
          <div className="draft-aurora" />
        </div>
        <div className="relative z-10 text-center">
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
      </div>
    );
  }

  /* ═════════════════════════════════════════════════════════
     RENDER — Full-Screen Draw Experience
     ═════════════════════════════════════════════════════════ */

  return (
    <div
      className="draw-exp"
      style={{ ['--stage-hue' as string]: stageHue }}
      onClick={drawPhase === 'idle' ? handleDraw : undefined}>
      {/* Atmospheric background */}
      <div
        className="draw-exp__bg"
        style={{
          background: stageHot
            ? `radial-gradient(ellipse 120% 80% at 50% 40%, hsl(${stageHue} 80% 12% / 0.7), ${C.bg} 70%)`
            : `radial-gradient(ellipse 100% 70% at 50% 30%, rgba(148, 255, 228, 0.04), ${C.bg} 60%)`,
        }}
      />
      {stageHot && (
        <div
          className="draw-exp__pulse"
          style={{
            background: `radial-gradient(circle at 50% 45%, hsl(${stageHue} 100% 50% / 0.08), transparent 50%)`,
          }}
        />
      )}

      <div className="draft-arena">
        <div className="draft-mesh" />
        <div className="draft-aurora" />
        <div className={`draft-vignette ${stageHot ? 'is-active' : ''}`} />
      </div>

      {/* Top info bar */}
      <div className="draw-topbar">
        <div className="draw-topbar__pill">Round {state.currentRound + 1}/4</div>
        <div className="draw-topbar__pill">
          Pick {state.currentPick + 1}/{state.playerOrder.length}
        </div>
        <div className="draw-topbar__pill">{state.availableTeams.length} left</div>
      </div>

      {/* Main centered content */}
      <div className="draw-main">
        {/* Player name */}
        <div className="draw-for">
          <div className="draw-for__eyebrow">Drawing for</div>
          <div
            className="font-display draw-for__name"
            style={{ color: C.accent, textShadow: `0 0 60px ${C.accent}30` }}>
            {currentPlayer}
          </div>
        </div>

        {/* The stage — mystery card OR flag carousel */}
        <div className="draw-stage">
          {/* IDLE: Mystery Card */}
          {!isActive && (
            <div className="mystery-card" style={{ cursor: 'pointer' }}>
              <div className="mystery-card__glow" />
              <div className="mystery-card__body">
                <div className="mystery-card__shimmer" />
                <div className="mystery-card__inner-border" />
                <div className="mystery-card__content">
                  <div className="mystery-card__icon">?</div>
                  <div className="mystery-card__cta">TAP TO DRAW</div>
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE: Slot Machine Reel */}
          {isActive && (
            <div
              className={[
                'slot-reel',
                drawPhase === 'spinning' && phase2Trigger ? 'is-spinning' : '',
                drawPhase === 'locking' || drawPhase === 'revealing' ? 'is-locked' : '',
              ]
                .filter(Boolean)
                .join(' ')}>
              <div className="slot-reel__bg" />
              <div className="slot-reel__rays" />
              <div
                className="slot-reel__strip"
                onTransitionEnd={handleStripTransitionEnd}
                style={{
                  transform: `translateY(${stripOffset}px)`,
                  filter: phase2Trigger ? 'blur(0px)' : 'blur(8px)',
                  transition: phase2Trigger
                    ? 'transform 4800ms cubic-bezier(0.05, 0.85, 0.18, 1), filter 4800ms cubic-bezier(0.05, 0.85, 0.18, 1)'
                    : 'none',
                }}>
                {reelTeams.map((team, i) => {
                  const hue = teamHue(team);
                  return (
                    <div
                      key={`${team}-${i}`}
                      className="slot-reel__card"
                      style={{ ['--card-hue' as string]: hue }}>
                      <div className="slot-reel__card-flag">
                        <DraftFlag
                          team={team}
                          width={130}
                          height={86}
                          size={160}
                          fit="cover"
                          style={{ width: '100%', height: '100%' }}
                        />
                      </div>
                      <div className="slot-reel__card-name">{team}</div>
                    </div>
                  );
                })}
              </div>
              <div className="slot-reel__fade slot-reel__fade--top" />
              <div className="slot-reel__fade slot-reel__fade--bottom" />
              <div className="slot-reel__window">
                <div className="slot-reel__window-glow" />
              </div>
              <div className="slot-reel__chevron slot-reel__chevron--left" aria-hidden>
                ▶
              </div>
              <div className="slot-reel__chevron slot-reel__chevron--right" aria-hidden>
                ◀
              </div>
            </div>
          )}
        </div>

        {/* Status text */}
        <div className="draw-status">
          {drawPhase === 'idle' && (
            <div
              className="draw-status__text"
              style={{
                color: `${C.accent}40`,
                animation: 'draft-fade-pulse 2s ease-in-out infinite',
              }}>
              TAP ANYWHERE TO DRAW
            </div>
          )}
          {drawPhase === 'spinning' && (
            <div className="draft-suspense is-active" style={{ position: 'relative' }}>
              <div className="draft-suspense__label">Spinning the reel...</div>
              <div className="draft-suspense__meter">
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>
          )}
          {drawPhase === 'locking' && (
            <div className="draw-status__text draw-status__text--lock" style={{ color: C.accent }}>
              LOCKED IN
            </div>
          )}
        </div>
      </div>

      {/* Bottom roster */}
      <div className="draw-roster">
        {state.playerOrder.map((name, i) => {
          const teams = getPlayerTeams(state.assignments, name);
          const isCurrent = i === state.currentPick;
          const isDone = i < state.currentPick;
          return (
            <div
              key={name}
              className={[
                'draw-roster__item',
                isCurrent ? 'is-current' : '',
                isDone ? 'is-done' : '',
              ]
                .filter(Boolean)
                .join(' ')}>
              <div className="draw-roster__name">{name}</div>
              <div className="draw-roster__flags">
                {teams.map((t) => (
                  <Flag key={t.team} team={t.team} size={14} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {drawPhase === 'locking' && <ConfettiBurst active seed={burstSeed} hue={stageHue} />}
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
