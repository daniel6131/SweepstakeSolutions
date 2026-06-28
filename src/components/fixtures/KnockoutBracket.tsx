'use client';

import gsap from 'gsap';
import { Flip } from 'gsap/dist/Flip';

import { Flag } from '@/components/ui/Flag';
import type {
  KnockoutMatch,
  KnockoutRound,
  KnockoutSlot,
  ProjectedKnockoutBracket,
} from '@/lib/knockout';
import { getFixtureDisplayParts } from '@/lib/match-time';
import type { ThemeColors } from '@/types';
import { ChevronLeft, ChevronRight, Trophy } from 'lucide-react';
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

gsap.registerPlugin(Flip);

/** The viewer's timezone, shared with the match cards so knockout kickoffs render
 *  in the same zone as the group fixtures (the bracket has many render layers, so
 *  a context is cleaner than threading a prop through all of them). */
const TimeZoneContext = createContext<string | null>(null);

/** Date + time for a knockout match, formatted in the viewer's timezone from the
 *  live `utcDate`. Falls back to the stored strings (pre-tournament projection). */
function useMatchTiming(match: KnockoutMatch): { dateLabel: string; timeLabel: string } {
  const timeZone = useContext(TimeZoneContext);
  const parts = getFixtureDisplayParts(
    { utcDate: match.utcDate, date: match.date, time: match.time },
    timeZone
  );
  return { dateLabel: parts.dateLabel, timeLabel: match.utcDate ? parts.timeWithZoneLabel : '' };
}

type Props = {
  bracket: ProjectedKnockoutBracket;
  ownerByTeam: Map<string, string>;
  theme: ThemeColors;
  timeZone: string | null;
};

type PositionedMatch = {
  match: KnockoutMatch;
  x: number;
  y: number;
  centerY: number;
};

const CARD_WIDTH = 252;
const CARD_HEIGHT = 168;
const COLUMN_GAP = 64;
const ROW_GAP = 22;
const PADDING = 28;
const STAGE_OFFSET = 76;
const CORNER = 16;
const CHAMP_WIDTH = 232;
const CHAMP_HEIGHT = 168;
/** One round column's horizontal stride. */
const COLUMN_STRIDE = CARD_WIDTH + COLUMN_GAP;
/** Collapsed-round rail (left side) — one thin tappable column per passed round. */
const RAIL_COL_WIDTH = 30;
const RAIL_GAP = 6;
/** Collapse / expand morph timing for a focus change (seconds). */
const MORPH_DURATION = 0.42;
/** Eased decelerate, matching the reference bracket's quick settle. */
const MORPH_EASE = 'power2.out';
/** Minimum horizontal wheel delta (px) that registers as an intentional step. */
const STEP_WHEEL_DELTA = 6;
/** Minimum horizontal swipe distance (px) for a touch step. */
const STEP_TOUCH_DELTA = 45;
/** Cooldown (ms) after a wheel-driven step before the next one is allowed. A
 *  fixed window (rather than a debounce reset by every event) keeps trackpad
 *  momentum from holding the gate shut. */
const STEP_COOLDOWN_MS = 520;

const GOLD = 'var(--color-medal-gold)';

function shortTeamName(team: string): string {
  return team
    .replace('Bosnia and Herzegovina', 'Bosnia & Herz.')
    .replace('Bosnia-Herzegovina', 'Bosnia & Herz.');
}

/** Position a set of rounds as a tree: the leftmost (index 0) round is evenly
 *  spaced, every later round is centred between the pair of children feeding it.
 *  Height is driven solely by the leftmost round's match count, so advancing the
 *  focus (dropping leading rounds) compresses the whole tree. */
function buildLayout(rounds: KnockoutRound[]) {
  const positionedRounds: PositionedMatch[][] = [];
  let previousCenters: number[] = [];

  rounds.forEach((round, roundIndex) => {
    const x = PADDING + roundIndex * COLUMN_STRIDE;
    const centers =
      roundIndex === 0
        ? round.matches.map(
            (_, matchIndex) => PADDING + matchIndex * (CARD_HEIGHT + ROW_GAP) + CARD_HEIGHT / 2
          )
        : round.matches.map(
            (_, matchIndex) =>
              (previousCenters[matchIndex * 2] + previousCenters[matchIndex * 2 + 1]) / 2
          );

    positionedRounds.push(
      round.matches.map((match, matchIndex) => ({
        match,
        x,
        y: centers[matchIndex] - CARD_HEIGHT / 2,
        centerY: centers[matchIndex],
      }))
    );

    previousCenters = centers;
  });

  const leadCount = rounds[0]?.matches.length ?? 1;
  const height = STAGE_OFFSET + PADDING * 2 + leadCount * CARD_HEIGHT + (leadCount - 1) * ROW_GAP;

  return { positionedRounds, height };
}

/** Structured orthogonal elbow (H → V → H) with rounded corners, from a
 *  source card edge into the target. Degrades to a straight line when level. */
function elbowPath(startX: number, startY: number, endX: number, endY: number): string {
  const branchX = startX + (endX - startX) / 2;
  const dy = endY - startY;
  const r = Math.min(CORNER, Math.abs(dy) / 2, branchX - startX, endX - branchX);
  if (r < 1) return `M ${startX} ${startY} H ${endX}`;
  const s = dy >= 0 ? 1 : -1;
  return [
    `M ${startX} ${startY}`,
    `H ${branchX - r}`,
    `Q ${branchX} ${startY} ${branchX} ${startY + s * r}`,
    `V ${endY - s * r}`,
    `Q ${branchX} ${endY} ${branchX + r} ${endY}`,
    `H ${endX}`,
  ].join(' ');
}

function Slot({
  slot,
  ownerByTeam,
  theme,
  align,
}: {
  slot: KnockoutSlot;
  ownerByTeam: Map<string, string>;
  theme: ThemeColors;
  align: 'left' | 'right';
}) {
  const reverse = align === 'right';
  const owner = slot.team ? (ownerByTeam.get(slot.team) ?? null) : null;

  if (slot.status === 'placeholder') {
    return (
      <div
        className={`flex h-11.5 items-center gap-2 rounded-xl border border-dashed px-3 ${
          reverse ? 'flex-row-reverse text-right' : ''
        }`}
        style={{ borderColor: `${theme.accent}24`, background: `${theme.accent}06` }}>
        <span
          className="font-heading shrink-0 text-[9px] font-bold tracking-[2px]"
          style={{ color: `${theme.accent}46` }}>
          {slot.seedLabel}
        </span>
        <span
          className="font-heading truncate text-[10px] font-semibold tracking-[0.5px] uppercase"
          style={{ color: `${theme.accent}66` }}>
          {slot.label}
        </span>
      </div>
    );
  }

  const accentText =
    slot.isWinner || slot.status === 'confirmed' ? theme.accent : 'var(--color-fg)';

  return (
    <div
      className={`flex h-11.5 items-center gap-2.5 rounded-xl px-2.5 ${
        reverse ? 'flex-row-reverse text-right' : ''
      }`}
      style={{
        background: slot.isWinner ? `${theme.accent}1f` : `${theme.accent}0b`,
        border: `1px solid ${slot.isWinner ? `${theme.accent}4d` : `${theme.accent}1a`}`,
        boxShadow: slot.isWinner ? `inset 0 0 22px ${theme.accent}1f` : undefined,
      }}>
      <Flag team={slot.label} size={22} />
      <div className="min-w-0 flex-1">
        <div className={`flex items-center gap-1.5 ${reverse ? 'flex-row-reverse' : ''}`}>
          <span
            className="font-display truncate text-[13px] leading-tight"
            style={{ color: accentText }}>
            {shortTeamName(slot.label)}
          </span>
          <span
            className="font-heading shrink-0 rounded px-1 py-px text-[8px] font-bold tracking-[1px]"
            style={{ color: `${theme.accent}88`, background: `${theme.accent}14` }}>
            {slot.seedLabel}
          </span>
        </div>
        {owner ? (
          <div className="truncate text-[9px] font-medium" style={{ color: `${theme.accent}55` }}>
            {owner}
          </div>
        ) : null}
      </div>
      {slot.score !== null ? (
        <span
          className="font-display shrink-0 text-[22px] leading-none tabular-nums"
          style={{ color: slot.isWinner ? theme.accent : 'var(--color-fg-muted)' }}>
          {slot.score}
        </span>
      ) : null}
    </div>
  );
}

function MatchCard({
  match,
  ownerByTeam,
  theme,
  width,
}: {
  match: KnockoutMatch;
  ownerByTeam: Map<string, string>;
  theme: ThemeColors;
  width?: number;
}) {
  const projected = match.home.status === 'projected' || match.away.status === 'projected';
  const { dateLabel, timeLabel } = useMatchTiming(match);

  return (
    <article
      className="flex flex-col overflow-hidden rounded-lg p-3"
      style={{
        width: width ?? CARD_WIDTH,
        height: CARD_HEIGHT,
        background: 'var(--card-surface)',
        border: match.isPlayed ? `1px solid ${theme.accent}3a` : '1px solid var(--card-border)',
        boxShadow: match.isPlayed
          ? `var(--card-highlight), var(--shadow-card), 0 0 30px -12px ${theme.accent}55`
          : 'var(--card-highlight), var(--shadow-card)',
      }}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span
          className="font-heading rounded-full px-2 py-0.5 text-[9px] font-bold tracking-[1.5px]"
          style={{ color: theme.bg, background: theme.accent }}>
          M{match.match}
        </span>
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{
              background: match.isPlayed ? theme.accent : `${theme.accent}40`,
              boxShadow: match.isPlayed ? `0 0 8px ${theme.accent}` : undefined,
            }}
          />
          <span
            className="font-heading text-[8px] font-bold tracking-[2px] uppercase"
            style={{ color: `${theme.accent}5a` }}>
            {match.isPlayed ? 'Full time' : projected ? 'Projected' : dateLabel}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-center gap-1.5">
        <Slot slot={match.home} ownerByTeam={ownerByTeam} theme={theme} align="left" />
        <Slot slot={match.away} ownerByTeam={ownerByTeam} theme={theme} align="right" />
      </div>

      <div
        className="font-heading mt-2 flex items-center justify-between gap-2 text-[8px] font-bold tracking-[1.5px] uppercase"
        style={{ color: `${theme.accent}40` }}>
        <span className="truncate">{match.venue && match.venue !== 'TBC' ? match.venue : ''}</span>
        <span className="shrink-0">{timeLabel ? `${dateLabel} · ${timeLabel}` : dateLabel}</span>
      </div>
    </article>
  );
}

function ChampionCard({
  team,
  owner,
  theme,
  width,
}: {
  team: string | null;
  owner: string | null;
  theme: ThemeColors;
  width?: number;
}) {
  return (
    <div
      className="relative flex flex-col items-center justify-center overflow-hidden rounded-lg p-4 text-center"
      style={{
        width,
        height: CHAMP_HEIGHT,
        background: `radial-gradient(120% 80% at 50% 0%, color-mix(in srgb, ${GOLD} 16%, transparent), transparent 70%), var(--card-surface)`,
        border: `1.5px solid color-mix(in srgb, ${GOLD} 55%, transparent)`,
        boxShadow: `var(--card-highlight), var(--shadow-card-lg), 0 24px 60px -26px color-mix(in srgb, ${GOLD} 75%, transparent)`,
      }}>
      <div
        className="pointer-events-none absolute -top-12 left-1/2 h-28 w-28 -translate-x-1/2 rounded-full blur-2xl"
        style={{ background: `color-mix(in srgb, ${GOLD} 32%, transparent)` }}
      />
      <Trophy size={26} style={{ color: GOLD }} strokeWidth={1.75} />
      <div
        className="font-heading mt-2 text-[9px] font-bold tracking-[3px] uppercase"
        style={{ color: GOLD }}>
        Champion
      </div>
      {team ? (
        <>
          <div className="mt-2.5 flex items-center gap-2">
            <Flag team={team} size={22} />
            <span className="font-display text-[16px]" style={{ color: 'var(--color-fg)' }}>
              {shortTeamName(team)}
            </span>
          </div>
          {owner ? (
            <div className="mt-0.5 text-[9px] font-medium" style={{ color: `${theme.accent}66` }}>
              {owner}
            </div>
          ) : null}
        </>
      ) : (
        <div
          className="font-display mt-2.5 text-[14px]"
          style={{ color: 'var(--color-fg-subtle)' }}>
          Awaiting the final
        </div>
      )}
    </div>
  );
}

// ── Mobile bracket (compact, horizontally-scrollable tree) ──
const M_CARD_W = 212;
const M_CARD_H = 138;
const M_COL_GAP = 38;
const M_ROW_GAP = 14;
const M_PAD = 6;
const M_COL_STRIDE = M_CARD_W + M_COL_GAP;
const M_CHAMP_W = 184;

/** Same tree maths as buildLayout, with the compact mobile dimensions and no
 *  per-column header offset (the round tabs label the rounds instead). */
function buildMobileLayout(rounds: KnockoutRound[]) {
  const positionedRounds: PositionedMatch[][] = [];
  let previousCenters: number[] = [];

  rounds.forEach((round, roundIndex) => {
    const x = M_PAD + roundIndex * M_COL_STRIDE;
    const centers =
      roundIndex === 0
        ? round.matches.map(
            (_, matchIndex) => M_PAD + matchIndex * (M_CARD_H + M_ROW_GAP) + M_CARD_H / 2
          )
        : round.matches.map(
            (_, matchIndex) =>
              (previousCenters[matchIndex * 2] + previousCenters[matchIndex * 2 + 1]) / 2
          );

    positionedRounds.push(
      round.matches.map((match, matchIndex) => ({
        match,
        x,
        y: centers[matchIndex] - M_CARD_H / 2,
        centerY: centers[matchIndex],
      }))
    );

    previousCenters = centers;
  });

  const leadCount = rounds[0]?.matches.length ?? 1;
  const height = M_PAD * 2 + leadCount * M_CARD_H + (leadCount - 1) * M_ROW_GAP;
  return { positionedRounds, height };
}

/** Compact fixed-size match card for the mobile tree — header + two slots, no
 *  venue footer, narrow enough that the next round and connectors stay in view. */
function MobileTreeCard({
  match,
  ownerByTeam,
  theme,
}: {
  match: KnockoutMatch;
  ownerByTeam: Map<string, string>;
  theme: ThemeColors;
}) {
  const projected = match.home.status === 'projected' || match.away.status === 'projected';
  const { dateLabel } = useMatchTiming(match);

  return (
    <article
      className="flex flex-col gap-1 overflow-hidden rounded-xl p-2.5"
      style={{
        width: M_CARD_W,
        height: M_CARD_H,
        background: 'var(--card-surface)',
        border: match.isPlayed ? `1px solid ${theme.accent}3a` : '1px solid var(--card-border)',
        boxShadow: match.isPlayed
          ? `var(--card-highlight), var(--shadow-card), 0 0 22px -14px ${theme.accent}55`
          : 'var(--card-highlight), var(--shadow-card)',
      }}>
      <div className="flex items-center justify-between gap-2">
        <span
          className="font-heading rounded-full px-1.5 py-0.5 text-[8px] font-bold tracking-[1px]"
          style={{ color: theme.bg, background: theme.accent }}>
          M{match.match}
        </span>
        <span
          className="font-heading text-[7px] font-bold tracking-[1.5px] uppercase"
          style={{ color: `${theme.accent}5a` }}>
          {match.isPlayed ? 'Full time' : projected ? 'Projected' : dateLabel}
        </span>
      </div>
      <div className="flex flex-1 flex-col justify-center gap-1">
        <Slot slot={match.home} ownerByTeam={ownerByTeam} theme={theme} align="left" />
        <Slot slot={match.away} ownerByTeam={ownerByTeam} theme={theme} align="left" />
      </div>
    </article>
  );
}

/** The mobile final's centrepiece — a centred, cinematic champion reveal:
 *  floodlit rays, a glowing trophy, the champion (or awaiting state), and a
 *  rising three-tier podium. Replaces the cramped champion card on phones. */
function ChampionPodium({
  team,
  owner,
  theme,
}: {
  team: string | null;
  owner: string | null;
  theme: ThemeColors;
}) {
  const tiers = [
    { rank: '2', height: 40, width: 60, lead: false },
    { rank: '1', height: 66, width: 66, lead: true },
    { rank: '3', height: 28, width: 60, lead: false },
  ];

  return (
    <div
      className="champion-podium relative mx-auto mt-4 w-full max-w-[330px] overflow-hidden rounded-[26px] px-6 pt-9 pb-7 text-center"
      style={{
        background: `radial-gradient(130% 100% at 50% -10%, color-mix(in srgb, ${GOLD} 24%, transparent), transparent 72%), var(--card-surface)`,
        border: `1.5px solid color-mix(in srgb, ${GOLD} 50%, transparent)`,
        boxShadow: `var(--card-highlight), var(--shadow-card-lg), 0 34px 90px -34px color-mix(in srgb, ${GOLD} 75%, transparent)`,
      }}>
      <div
        className="bg-grain pointer-events-none absolute inset-0"
        style={{ opacity: 0.06, mixBlendMode: 'overlay' }}
      />
      <div
        className="champion-rays pointer-events-none absolute top-[-30%] left-1/2 h-[150%] w-[150%] -translate-x-1/2"
        style={{
          background: `conic-gradient(from 0deg at 50% 0%, transparent 0deg, color-mix(in srgb, ${GOLD} 13%, transparent) 11deg, transparent 22deg, transparent 38deg, color-mix(in srgb, ${GOLD} 13%, transparent) 49deg, transparent 60deg)`,
          maskImage: 'radial-gradient(58% 58% at 50% 0%, #000, transparent)',
          WebkitMaskImage: 'radial-gradient(58% 58% at 50% 0%, #000, transparent)',
        }}
      />

      <div className="relative">
        <div
          className="champion-glow pointer-events-none absolute top-[-8px] left-1/2 h-32 w-32 -translate-x-1/2 rounded-full blur-2xl"
          style={{ background: `color-mix(in srgb, ${GOLD} 38%, transparent)` }}
        />
        <Trophy
          size={46}
          strokeWidth={1.5}
          style={{ color: GOLD }}
          className="champion-trophy relative mx-auto"
        />
      </div>

      <div
        className="font-heading relative mt-3 text-[11px] font-bold tracking-[5px] uppercase"
        style={{ color: GOLD }}>
        World Champion
      </div>

      {team ? (
        <div className="relative">
          <div className="mt-4 flex justify-center">
            <div
              className="champion-flag"
              style={{
                filter: `drop-shadow(0 8px 22px color-mix(in srgb, ${GOLD} 45%, transparent))`,
              }}>
              <Flag team={team} size={60} />
            </div>
          </div>
          <div
            className="font-display mt-3 text-[30px] leading-none tracking-[-0.02em]"
            style={{ color: 'var(--color-fg)' }}>
            {shortTeamName(team)}
          </div>
          {owner ? (
            <div
              className="font-heading mt-2 text-[11px] font-bold tracking-[2.5px] uppercase"
              style={{ color: theme.accent }}>
              {owner}
            </div>
          ) : null}
        </div>
      ) : (
        <div
          className="font-display relative mt-4 text-[24px] leading-[1.05]"
          style={{ color: 'var(--color-fg-subtle)' }}>
          Awaiting
          <br />
          the final
        </div>
      )}

      <div className="champion-pedestal relative mt-7 flex items-end justify-center gap-2">
        {tiers.map((tier) => (
          <div
            key={tier.rank}
            className="flex shrink-0 items-start justify-center rounded-t-lg pt-1.5"
            style={{
              width: tier.width,
              height: tier.height,
              background: tier.lead
                ? `linear-gradient(180deg, color-mix(in srgb, ${GOLD} 82%, transparent), color-mix(in srgb, ${GOLD} 30%, transparent))`
                : `linear-gradient(180deg, color-mix(in srgb, ${GOLD} 42%, transparent), color-mix(in srgb, ${GOLD} 12%, transparent))`,
              borderTop: `1.5px solid color-mix(in srgb, ${GOLD} ${tier.lead ? 92 : 55}%, transparent)`,
            }}>
            <span
              className="font-display text-[13px] leading-none"
              style={{
                color: tier.lead
                  ? 'var(--color-bg)'
                  : `color-mix(in srgb, ${GOLD} 85%, transparent)`,
              }}>
              {tier.rank}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Mobile knockout view — round tabs over a compact, horizontally-scrollable
 *  bracket tree. Tapping a tab focuses that round (showing it → final, with the
 *  height driven by its match count); the tree swipes horizontally so the next
 *  rounds and their connectors stay visible, the way Google's bracket does.
 *  Changing rounds runs the same collapse/expand Flip morph as desktop —
 *  dropped rounds slide off, reappearing ones slide back in, connectors track
 *  the cards each frame, and the container height eases between rounds. */
function MobileBracket({
  rounds,
  ownerByTeam,
  theme,
  championTeam,
  championOwner,
}: {
  rounds: KnockoutRound[];
  ownerByTeam: Map<string, string>;
  theme: ThemeColors;
  championTeam: string | null;
  championOwner: string | null;
}) {
  const flowId = useId();
  const scrollRef = useRef<HTMLDivElement>(null);
  const treeRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const flipState = useRef<ReturnType<typeof Flip.getState> | null>(null);
  const animating = useRef(false);
  const fromHeightRef = useRef(0);
  const reducedRef = useRef(false);
  // Clones of the departing round's cards, captured before React removes them,
  // so they can animate out on a layer behind the surviving tree (Flip can't
  // reliably animate framework-removed nodes) — identical to the desktop tree.
  const leavingClonesRef = useRef<{ el: HTMLElement; left: number }[]>([]);
  const [focus, setFocus] = useState(0);
  const [containerW, setContainerW] = useState(0);

  const safeFocus = Math.min(focus, rounds.length - 1);
  const visibleRounds = rounds.slice(safeFocus);
  const { positionedRounds, height } = buildMobileLayout(visibleRounds);

  const finalPos = positionedRounds[positionedRounds.length - 1]?.[0];
  const champCenterY = finalPos?.centerY ?? 0;
  const finalMatch = rounds[rounds.length - 1]?.matches[0];

  // Champion is a card to the right on multi-round views; on the final-only view
  // it becomes a centred podium rendered below the tree, so the tree then holds
  // only the (horizontally centred) final match.
  const isFinalOnly = visibleRounds.length === 1;
  const champX = M_PAD + visibleRounds.length * M_COL_STRIDE;
  const centeredFinalX = Math.max(M_PAD, (containerW - M_CARD_W) / 2);
  const treeWidth = isFinalOnly
    ? Math.max(containerW, M_PAD * 2 + M_CARD_W)
    : champX + M_CHAMP_W + M_PAD;
  const treeHeight = isFinalOnly ? M_PAD * 2 + M_CARD_H : height;

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      reducedRef.current = mq.matches;
    };
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  // Track the gesture container's width so the final match + podium can centre.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => setContainerW(entries[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const selectRound = (index: number) => {
    const clamped = Math.max(0, Math.min(rounds.length - 1, index));
    if (clamped === safeFocus || animating.current) return;
    leavingClonesRef.current = [];
    if (!reducedRef.current && treeRef.current) {
      flipState.current = Flip.getState(treeRef.current.querySelectorAll('[data-flip-id]'), {
        props: 'opacity',
      });
      fromHeightRef.current = treeHeight;
      animating.current = true;

      // Advancing drops leading round(s) — clone their cards now, while still
      // mounted, so we can animate the exit ourselves on a layer behind the tree.
      if (clamped > safeFocus) {
        const leavingIds = new Set<string>();
        rounds.slice(safeFocus, clamped).forEach((round) => {
          round.matches.forEach((m) => leavingIds.add(`m-${m.match}`));
        });
        treeRef.current.querySelectorAll<HTMLElement>('[data-flip-id]').forEach((el) => {
          if (!leavingIds.has(el.getAttribute('data-flip-id') ?? '')) return;
          const clone = el.cloneNode(true) as HTMLElement;
          clone.removeAttribute('data-flip-id');
          clone.style.position = 'absolute';
          clone.style.left = `${el.offsetLeft}px`;
          clone.style.top = `${el.offsetTop}px`;
          clone.style.width = `${el.offsetWidth}px`;
          clone.style.margin = '0';
          clone.style.pointerEvents = 'none';
          leavingClonesRef.current.push({ el: clone, left: el.offsetLeft });
        });
      }
    }
    setFocus(clamped);
  };

  // Run the collapse / expand morph once the focused layout has re-rendered.
  useLayoutEffect(() => {
    const state = flipState.current;
    if (!state) return;
    flipState.current = null;

    const svg = svgRef.current;
    const tree = treeRef.current;
    const toHeight = treeHeight;
    const fromHeight = fromHeightRef.current;

    const edges: { k: number; top: number; bot: number; target: number }[] = [];
    positionedRounds.slice(0, -1).forEach((round, ri) => {
      round.forEach((src, mi) => {
        if (mi % 2 !== 0) return;
        const sib = round[mi + 1];
        const tgt = positionedRounds[ri + 1]?.[Math.floor(mi / 2)];
        if (!sib || !tgt) return;
        edges.push({
          k: src.match.match,
          top: src.match.match,
          bot: sib.match.match,
          target: tgt.match.match,
        });
      });
    });

    const cardRect = (flipId: string) => {
      if (!svg || !tree) return null;
      const el = tree.querySelector(`[data-flip-id="${flipId}"]`);
      if (!el) return null;
      const base = svg.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      return {
        left: r.left - base.left,
        right: r.right - base.left,
        cy: r.top - base.top + r.height / 2,
      };
    };
    const setD = (conn: string, d: string) =>
      svg?.querySelector(`[data-conn="${conn}"]`)?.setAttribute('d', d);

    const redraw = () => {
      for (const e of edges) {
        const s = cardRect(`m-${e.top}`);
        const sib = cardRect(`m-${e.bot}`);
        const t = cardRect(`m-${e.target}`);
        if (!s || !sib || !t) continue;
        setD(`t-${e.k}`, elbowPath(s.right, s.cy, t.left, t.cy));
        setD(`b-${e.k}`, elbowPath(sib.right, sib.cy, t.left, t.cy));
      }
      if (finalMatch && !isFinalOnly) {
        const s = cardRect(`m-${finalMatch.match}`);
        const c = cardRect('champion');
        if (s && c) setD('champ', elbowPath(s.right, s.cy, c.left, c.cy));
      }
    };

    if (tree && fromHeight && fromHeight !== toHeight) {
      // Settle at toHeight (which equals the React-rendered height) — do NOT
      // clearProps, since the absolutely-positioned cards give the tree no
      // intrinsic height, so dropping the inline height collapses it to 0.
      gsap.fromTo(
        tree,
        { height: fromHeight },
        { height: toHeight, duration: MORPH_DURATION, ease: MORPH_EASE }
      );
    }

    // Reappearing round (retreat): slide in from the left while expanding.
    const collapsed = {
      xPercent: -115,
      scaleX: 0.18,
      scaleY: 0.78,
      opacity: 0,
      transformOrigin: 'left center' as const,
    };

    // Only the live nodes are targets, so Flip animates the surviving cards and
    // detects entering ones; leaving cards are handled via clones below, so Flip
    // never touches them (no onLeave — that was what painted over the tree).
    const liveTargets = tree ? Array.from(tree.querySelectorAll('[data-flip-id]')) : [];

    Flip.from(state, {
      targets: liveTargets,
      duration: MORPH_DURATION,
      ease: MORPH_EASE,
      absolute: true,
      onUpdate: redraw,
      onEnter: (els) =>
        gsap.from(els, {
          ...collapsed,
          duration: MORPH_DURATION,
          ease: MORPH_EASE,
          stagger: 0.02,
          onUpdate: redraw,
        }),
      onComplete: () => {
        animating.current = false;
        redraw();
      },
    });

    // Departing round (advance): animate the cloned cards out on a layer behind
    // the surviving tree — they collapse and slide straight off the left.
    const clones = leavingClonesRef.current;
    leavingClonesRef.current = [];
    if (clones.length && scrollRef.current && tree) {
      const layer = document.createElement('div');
      layer.style.cssText = 'position:absolute;inset:0;z-index:0;pointer-events:none;';
      scrollRef.current.insertBefore(layer, tree);
      clones.forEach(({ el, left }) => {
        layer.appendChild(el);
        gsap.to(el, {
          x: -(left + M_CARD_W),
          scaleX: 0.5,
          scaleY: 0.5,
          opacity: 0,
          transformOrigin: 'left center',
          duration: MORPH_DURATION,
          ease: MORPH_EASE,
        });
      });
      gsap.delayedCall(MORPH_DURATION + 0.1, () => layer.remove());
    }

    redraw();
  }, [focus, treeHeight, positionedRounds, finalMatch, isFinalOnly]);

  // One round per horizontal swipe/wheel — same discrete stepping as desktop, so
  // navigating the bracket by gesture runs the collapse/expand morph too. A ref
  // keeps the listeners (attached once) reading the latest focus.
  const stepFocus = (delta: number) =>
    selectRound(Math.max(0, Math.min(rounds.length - 1, safeFocus + delta)));
  const stepRef = useRef<(delta: number) => void>(() => {});
  useEffect(() => {
    stepRef.current = stepFocus;
  });

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let lastStepAt = -Infinity;
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      event.preventDefault();
      if (animating.current || Math.abs(event.deltaX) < STEP_WHEEL_DELTA) return;
      const now = event.timeStamp;
      if (now - lastStepAt < STEP_COOLDOWN_MS) return;
      lastStepAt = now;
      stepRef.current(event.deltaX > 0 ? 1 : -1);
    };

    let startX = 0;
    let startY = 0;
    let swiped = false;
    let horizontal: boolean | null = null;
    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      startX = touch.clientX;
      startY = touch.clientY;
      swiped = false;
      horizontal = null;
    };
    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      if (horizontal === null && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
        horizontal = Math.abs(dx) > Math.abs(dy);
      }
      if (!horizontal) return; // vertical swipe → page scrolls
      event.preventDefault();
      if (swiped || animating.current || Math.abs(dx) < STEP_TOUCH_DELTA) return;
      swiped = true;
      stepRef.current(dx < 0 ? 1 : -1);
    };
    const onTouchEnd = () => {
      swiped = false;
      horizontal = null;
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  return (
    <div className="relative z-10">
      {/* Round tabs */}
      <div
        role="tablist"
        aria-label="Knockout rounds"
        className="-mx-1 mb-3 flex gap-1.5 overflow-x-auto px-1 pb-1"
        style={{ scrollbarWidth: 'none' }}>
        {rounds.map((round, index) => {
          const selected = index === safeFocus;
          return (
            <button
              key={round.key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => selectRound(index)}
              className="font-heading shrink-0 cursor-pointer rounded-full px-3 py-1.5 text-[10px] font-bold tracking-[1px] uppercase transition-colors duration-200"
              style={{
                color: selected ? theme.bg : `${theme.accent}85`,
                background: selected ? theme.accent : `${theme.accent}0d`,
                border: `1px solid ${selected ? theme.accent : `${theme.accent}1f`}`,
              }}>
              {round.shortTitle}
            </button>
          );
        })}
      </div>

      {/* Clipped tree — a horizontal swipe steps one round (with the morph);
          vertical gestures pass through to the page (touch-action: pan-y). */}
      <div ref={scrollRef} className="relative overflow-hidden" style={{ touchAction: 'pan-y' }}>
        <div ref={treeRef} className="relative" style={{ width: treeWidth, height: treeHeight }}>
          <svg
            ref={svgRef}
            className="pointer-events-none absolute inset-0 h-full w-full"
            fill="none"
            aria-hidden="true">
            <defs>
              <linearGradient id={flowId} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={`${theme.accent}38`} />
                <stop offset="55%" stopColor={`${theme.accent}80`} />
                <stop offset="100%" stopColor={theme.accent} />
              </linearGradient>
            </defs>
            {positionedRounds.slice(0, -1).flatMap((round, roundIndex) =>
              round.flatMap((source, matchIndex) => {
                if (matchIndex % 2 !== 0) return [];
                const sibling = round[matchIndex + 1];
                const target = positionedRounds[roundIndex + 1][Math.floor(matchIndex / 2)];
                if (!sibling || !target) return [];
                const startX = source.x + M_CARD_W;
                const endX = target.x;
                const dTop = elbowPath(startX, source.centerY, endX, target.centerY);
                const dBot = elbowPath(startX, sibling.centerY, endX, target.centerY);
                const k = source.match.match;
                return [
                  <path
                    key={`t-${k}`}
                    data-conn={`t-${k}`}
                    d={dTop}
                    stroke={`url(#${flowId})`}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                  />,
                  <path
                    key={`b-${k}`}
                    data-conn={`b-${k}`}
                    d={dBot}
                    stroke={`url(#${flowId})`}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                  />,
                ];
              })
            )}
            {finalPos && !isFinalOnly ? (
              <path
                data-conn="champ"
                d={elbowPath(finalPos.x + M_CARD_W, champCenterY, champX, champCenterY)}
                style={{ stroke: GOLD }}
                strokeWidth={2}
                strokeLinecap="round"
              />
            ) : null}
          </svg>

          {positionedRounds.flatMap((round) =>
            round.map(({ match, x, y }) => (
              <div
                key={match.match}
                className="absolute"
                data-flip-id={`m-${match.match}`}
                style={{ left: isFinalOnly ? centeredFinalX : x, top: y }}>
                <MobileTreeCard match={match} ownerByTeam={ownerByTeam} theme={theme} />
              </div>
            ))
          )}

          {finalPos && !isFinalOnly ? (
            <div
              className="absolute"
              data-flip-id="champion"
              style={{ left: champX, top: champCenterY - CHAMP_HEIGHT / 2 }}>
              <ChampionCard
                team={championTeam}
                owner={championOwner}
                theme={theme}
                width={M_CHAMP_W}
              />
            </div>
          ) : null}
        </div>
      </div>

      {finalPos && isFinalOnly ? (
        <ChampionPodium team={championTeam} owner={championOwner} theme={theme} />
      ) : null}
    </div>
  );
}

/** One collapsed (passed) round — a thin, full-height, tappable column that
 *  promotes itself back to the leftmost focus round when clicked. */
function RailColumn({
  round,
  theme,
  onClick,
}: {
  round: KnockoutRound;
  theme: ThemeColors;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Show ${round.title}`}
      className="group flex shrink-0 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl transition-colors duration-200"
      style={{
        width: RAIL_COL_WIDTH,
        background: `${theme.accent}0a`,
        border: '1px solid var(--card-border)',
      }}>
      <span
        className="font-heading text-[10px] font-bold tracking-[3px] uppercase transition-colors duration-200"
        style={{
          color: `${theme.accent}70`,
          writingMode: 'vertical-rl',
          transform: 'rotate(180deg)',
        }}>
        {round.shortTitle}
      </span>
      <ChevronRight size={13} style={{ color: `${theme.accent}55` }} aria-hidden="true" />
    </button>
  );
}

export function KnockoutBracket(props: Props) {
  return (
    <TimeZoneContext.Provider value={props.timeZone}>
      <KnockoutBracketInner {...props} />
    </TimeZoneContext.Provider>
  );
}

function KnockoutBracketInner({ bracket, ownerByTeam, theme }: Props) {
  const flowId = useId();
  const rounds = bracket.rounds;
  const lastIndex = rounds.length - 1;

  const [focus, setFocus] = useState(0);
  // Render the desktop tree or the mobile bracket — never both. Mounting both
  // (one merely hidden) doubled the card/SVG work and made switching to the
  // Knockout view feel unresponsive on phones. useSyncExternalStore gives the
  // correct breakpoint on the very first client render (this view mounts on tab
  // switch, not during hydration), so the right variant mounts once.
  const isMobile = useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia('(max-width: 767px)');
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    },
    () => window.matchMedia('(max-width: 767px)').matches,
    () => false
  );

  const wrapRef = useRef<HTMLDivElement>(null);
  const treeRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const flipState = useRef<ReturnType<typeof Flip.getState> | null>(null);
  const animating = useRef(false);
  const focusRef = useRef(0);
  const lastIndexRef = useRef(lastIndex);
  const reducedRef = useRef(false);
  const heightRef = useRef(0);
  const fromHeightRef = useRef(0);
  const stepFocusRef = useRef<(delta: number) => void>(() => {});
  // Snapshot of the departing round's cards (clones) captured before React
  // removes them, so we can animate them out independently of Flip.
  const leavingClonesRef = useRef<{ el: HTMLElement; top: number; height: number; left: number }[]>(
    []
  );

  const visibleRounds = rounds.slice(focus);
  const passedRounds = rounds.slice(0, focus);
  const { positionedRounds, height } = buildLayout(visibleRounds);

  const lastVisibleIndex = positionedRounds.length - 1;
  const finalPos = positionedRounds[lastVisibleIndex]?.[0];
  const finalMatch = rounds[lastIndex]?.matches[0];
  const championTeam =
    finalMatch?.winner === 'home'
      ? finalMatch.home.team
      : finalMatch?.winner === 'away'
        ? finalMatch.away.team
        : null;
  const championOwner = championTeam ? (ownerByTeam.get(championTeam) ?? null) : null;

  const champX = PADDING + visibleRounds.length * COLUMN_STRIDE;
  const totalWidth = champX + CHAMP_WIDTH + PADDING;
  const champCenterY = finalPos ? finalPos.centerY + STAGE_OFFSET : 0;
  const railWidth = passedRounds.length
    ? passedRounds.length * RAIL_COL_WIDTH + (passedRounds.length - 1) * RAIL_GAP + 12
    : 0;

  // Mirror the latest committed values into refs so event handlers and the Flip
  // effect can read them without re-subscribing listeners — and without writing
  // refs during render (which React forbids).
  useEffect(() => {
    focusRef.current = focus;
    lastIndexRef.current = lastIndex;
    heightRef.current = height;
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      reducedRef.current = mq.matches;
    };
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  /** Capture the current tree layout, then move focus. A layout effect picks the
   *  captured state up and runs the Flip collapse/expand once React paints the
   *  new layout — cards glide and the tree compresses rather than disappearing. */
  const goToFocus = (next: number) => {
    const clamped = Math.max(0, Math.min(lastIndexRef.current, next));
    if (clamped === focusRef.current || animating.current) return;
    leavingClonesRef.current = [];
    if (!reducedRef.current && treeRef.current) {
      flipState.current = Flip.getState(treeRef.current.querySelectorAll('[data-flip-id]'), {
        props: 'opacity',
      });
      fromHeightRef.current = heightRef.current;
      animating.current = true;

      // Advancing drops the leading round(s). Clone their cards now — while they
      // are still mounted and correctly positioned — so we can animate the exit
      // ourselves. (Flip can't reliably animate framework-removed nodes.)
      if (clamped > focusRef.current) {
        const leavingIds = new Set<string>();
        rounds.slice(focusRef.current, clamped).forEach((round) => {
          leavingIds.add(`hdr-${round.key}`);
          round.matches.forEach((m) => leavingIds.add(`m-${m.match}`));
        });
        treeRef.current.querySelectorAll<HTMLElement>('[data-flip-id]').forEach((el) => {
          if (!leavingIds.has(el.getAttribute('data-flip-id') ?? '')) return;
          const clone = el.cloneNode(true) as HTMLElement;
          clone.removeAttribute('data-flip-id');
          clone.style.position = 'absolute';
          clone.style.left = `${el.offsetLeft}px`;
          clone.style.top = `${el.offsetTop}px`;
          clone.style.width = `${el.offsetWidth}px`;
          clone.style.margin = '0';
          clone.style.pointerEvents = 'none';
          leavingClonesRef.current.push({
            el: clone,
            top: el.offsetTop,
            height: el.offsetHeight,
            left: el.offsetLeft,
          });
        });
      }
    }
    setFocus(clamped);
  };

  const stepFocus = (delta: number) => goToFocus(focusRef.current + delta);
  useEffect(() => {
    stepFocusRef.current = stepFocus;
  });

  // Run the collapse / expand morph after the focused layout has re-rendered.
  useLayoutEffect(() => {
    const state = flipState.current;
    if (!state) return;
    flipState.current = null;

    const svg = svgRef.current;
    const tree = treeRef.current;
    const wrap = wrapRef.current;
    const fromHeight = fromHeightRef.current;
    const toHeight = height;

    // Connector list for the *target* layout (same pairing as the render).
    const edges: { k: number; top: number; bot: number; target: number }[] = [];
    positionedRounds.slice(0, -1).forEach((round, ri) => {
      round.forEach((src, mi) => {
        if (mi % 2 !== 0) return;
        const sib = round[mi + 1];
        const tgt = positionedRounds[ri + 1]?.[Math.floor(mi / 2)];
        if (!sib || !tgt) return;
        edges.push({
          k: src.match.match,
          top: src.match.match,
          bot: sib.match.match,
          target: tgt.match.match,
        });
      });
    });

    // Read a card's live position (includes the in-flight Flip transform) in the
    // SVG's local coordinate space, so connectors track the cards exactly.
    const cardRect = (flipId: string) => {
      if (!svg || !tree) return null;
      const el = tree.querySelector(`[data-flip-id="${flipId}"]`);
      if (!el) return null;
      const base = svg.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      return {
        left: r.left - base.left,
        right: r.right - base.left,
        cy: r.top - base.top + r.height / 2,
      };
    };
    const setD = (conn: string, d: string) =>
      svg?.querySelector(`[data-conn="${conn}"]`)?.setAttribute('d', d);

    // Redraw every elbow from the cards' current positions — called each frame so
    // the lines bend continuously with the cards rather than fading out and in.
    const redraw = () => {
      for (const e of edges) {
        const s = cardRect(`m-${e.top}`);
        const sib = cardRect(`m-${e.bot}`);
        const t = cardRect(`m-${e.target}`);
        if (!s || !sib || !t) continue;
        const dTop = elbowPath(s.right, s.cy, t.left, t.cy);
        const dBot = elbowPath(sib.right, sib.cy, t.left, t.cy);
        setD(`t-${e.k}`, dTop);
        setD(`gt-${e.k}`, dTop);
        setD(`b-${e.k}`, dBot);
        setD(`gb-${e.k}`, dBot);
      }
      if (finalMatch) {
        const s = cardRect(`m-${finalMatch.match}`);
        const c = cardRect('champion');
        if (s && c) {
          const d = elbowPath(s.right, s.cy, c.left, c.cy);
          setD('champ', d);
          setD('champ-glow', d);
        }
      }
    };

    // Resize the container in lock-step so the page below glides, not jumps.
    if (wrap && fromHeight && fromHeight !== toHeight) {
      gsap.fromTo(
        wrap,
        { height: fromHeight },
        {
          height: toHeight,
          duration: MORPH_DURATION,
          ease: MORPH_EASE,
          onComplete: () => {
            gsap.set(wrap, { clearProps: 'height' });
          },
        }
      );
    }

    // Collapse/expand the leaving/entering round.
    const collapsed = {
      xPercent: -115,
      scaleX: 0.18,
      scaleY: 0.78,
      opacity: 0,
      transformOrigin: 'left center' as const,
    };

    // Use only the live nodes as targets. Flip then animates the surviving cards
    // and detects entering ones (in the DOM, not in the captured state); leaving
    // cards are handled separately via clones, so Flip never touches them.
    const liveTargets = tree ? Array.from(tree.querySelectorAll('[data-flip-id]')) : [];

    Flip.from(state, {
      targets: liveTargets,
      duration: MORPH_DURATION,
      ease: MORPH_EASE,
      absolute: true,
      onUpdate: redraw,
      // Reappearing round (retreat): slide in from the left while expanding.
      onEnter: (els) =>
        gsap.from(els, {
          ...collapsed,
          duration: MORPH_DURATION,
          ease: MORPH_EASE,
          stagger: 0.02,
          onUpdate: redraw,
        }),
      onComplete: () => {
        animating.current = false;
        redraw();
      },
    });

    // Departing round (advance): animate the cloned cards out. They collapse to a
    // short pill, pull together toward the column centre, and slide off the left —
    // mounted on a layer *behind* the surviving tree.
    const clones = leavingClonesRef.current;
    leavingClonesRef.current = [];
    if (clones.length && wrap && tree) {
      const layer = document.createElement('div');
      layer.style.cssText = 'position:absolute;inset:0;z-index:0;pointer-events:none;';
      wrap.insertBefore(layer, tree);
      clones.forEach(({ el, left }) => {
        layer.appendChild(el);
        // Shrink in place (no vertical movement) and slide straight off the left.
        gsap.to(el, {
          x: -(left + CARD_WIDTH),
          scaleX: 0.5,
          scaleY: 0.5,
          opacity: 0,
          transformOrigin: 'left center',
          duration: MORPH_DURATION,
          ease: MORPH_EASE,
        });
      });
      gsap.delayedCall(MORPH_DURATION + 0.1, () => layer.remove());
    }

    // Align paths to the cards' start positions before the browser paints.
    redraw();
  }, [focus, height, positionedRounds, finalMatch]);

  // Discrete one-step-per-gesture navigation. A single horizontal wheel notch or
  // swipe advances/retreats exactly one round; vertical gestures fall straight
  // through to the page so scrolling into and past the bracket is never trapped.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    let lastStepAt = -Infinity;

    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return; // vertical → page scrolls
      event.preventDefault();
      if (animating.current || Math.abs(event.deltaX) < STEP_WHEEL_DELTA) return;
      const now = event.timeStamp;
      if (now - lastStepAt < STEP_COOLDOWN_MS) return; // fixed cooldown — never gets stuck
      lastStepAt = now;
      stepFocusRef.current(event.deltaX > 0 ? 1 : -1);
    };

    let startX = 0;
    let startY = 0;
    let swiped = false;
    let horizontal: boolean | null = null;

    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      startX = touch.clientX;
      startY = touch.clientY;
      swiped = false;
      horizontal = null;
    };
    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      if (horizontal === null && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
        horizontal = Math.abs(dx) > Math.abs(dy);
      }
      if (!horizontal) return; // vertical swipe → page scrolls
      event.preventDefault();
      if (swiped || animating.current || Math.abs(dx) < STEP_TOUCH_DELTA) return;
      swiped = true;
      stepFocusRef.current(dx < 0 ? 1 : -1);
    };
    const onTouchEnd = () => {
      swiped = false;
      horizontal = null;
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  return (
    <div className="space-y-6 md:space-y-8" data-reveal>
      {/* ── Knockout title card ── */}
      <section
        className="relative overflow-hidden rounded-[30px] p-6 md:p-9"
        style={{
          background: `radial-gradient(120% 130% at 100% 0%, color-mix(in srgb, ${GOLD} 13%, transparent) 0%, transparent 42%), radial-gradient(110% 130% at 0% 100%, ${theme.accent}16 0%, transparent 48%), var(--card-surface)`,
          border: '1px solid var(--card-border)',
          boxShadow: 'var(--card-highlight), var(--shadow-card-lg)',
        }}>
        <div
          className="bg-grain pointer-events-none absolute inset-0"
          style={{ opacity: 0.05, mixBlendMode: 'overlay' }}
        />

        <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <div
              className="font-heading mb-3 flex items-center gap-2 text-[10px] font-bold tracking-[3px] uppercase"
              style={{ color: `${theme.accent}72` }}>
              <Trophy size={13} strokeWidth={2} style={{ color: GOLD }} />
              Knockout Stage · 2026
            </div>
            <h3
              className="font-display text-[44px] leading-[0.88] tracking-[-0.04em] md:text-[64px]"
              style={{ color: 'var(--color-fg)' }}>
              Road to the{' '}
              <span
                style={{
                  color: GOLD,
                  textShadow: `0 0 44px color-mix(in srgb, ${GOLD} 55%, transparent)`,
                }}>
                final
              </span>
            </h3>
          </div>

          <div className="flex shrink-0 items-center gap-7 md:gap-9">
            <div>
              <div
                className="font-display text-[40px] leading-none tabular-nums md:text-[48px]"
                style={{ color: theme.accent }}>
                {bracket.completedGroups}
                <span style={{ color: `${theme.accent}40` }}>/{bracket.totalGroups}</span>
              </div>
              <div
                className="font-heading mt-2 text-[9px] font-bold tracking-[2px] uppercase"
                style={{ color: `${theme.accent}55` }}>
                Groups complete
              </div>
            </div>
            <div className="h-11 w-px" style={{ background: `${theme.accent}22` }} />
            <div>
              <div
                className="font-display text-[40px] leading-none tabular-nums md:text-[48px]"
                style={{ color: theme.accent }}>
                {bracket.thirdPlaceStandings.filter((entry) => entry.qualified).length}
              </div>
              <div
                className="font-heading mt-2 text-[9px] font-bold tracking-[2px] uppercase"
                style={{ color: `${theme.accent}55` }}>
                Thirds qualifying
              </div>
            </div>
          </div>
        </div>

        <div
          className="relative z-10 mt-7 border-t pt-5"
          style={{ borderColor: 'var(--card-border)' }}>
          <div
            className="font-heading mb-3 text-[9px] font-bold tracking-[2px] uppercase"
            style={{ color: `${theme.accent}50` }}>
            Best third-placed teams · live
          </div>
          <div className="flex flex-wrap gap-2">
            {bracket.thirdPlaceStandings
              .filter((entry) => entry.qualified)
              .map((entry) => (
                <div
                  key={entry.group}
                  className="flex items-center gap-2 rounded-full py-1.5 pr-3 pl-1.5"
                  style={{
                    background: `${theme.accent}0c`,
                    border: '1px solid var(--card-border)',
                  }}>
                  <Flag team={entry.team} size={18} />
                  <span className="font-display text-[12px]" style={{ color: 'var(--color-fg)' }}>
                    {shortTeamName(entry.team)}
                  </span>
                  <span
                    className="font-heading text-[8px] font-bold tracking-[1.5px] uppercase"
                    style={{ color: `${theme.accent}55` }}>
                    Grp {entry.group}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* ── Projected bracket ── */}
      <section
        className="relative overflow-hidden rounded-[30px] p-4 md:p-5"
        style={{
          background: `radial-gradient(90% 120% at 100% 50%, ${theme.accent}12 0%, transparent 55%), var(--card-surface)`,
          border: '1px solid var(--card-border)',
          boxShadow: 'var(--card-highlight), var(--shadow-card-lg)',
        }}
        data-reveal>
        <div className="relative z-10 mb-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div
              className="font-heading text-[10px] font-bold tracking-[3px] uppercase"
              style={{ color: `${theme.accent}60` }}>
              Projected Bracket
            </div>
            <div
              className="font-display mt-1 hidden truncate text-[26px] leading-none tracking-[-0.03em] md:block md:text-[34px]"
              style={{ color: 'var(--color-fg)' }}>
              {visibleRounds[0]?.title ?? 'Final'} to final
            </div>
            <div
              className="font-display mt-1 text-[24px] leading-none tracking-[-0.03em] md:hidden"
              style={{ color: 'var(--color-fg)' }}>
              Road to final
            </div>
          </div>

          {/* Round stepper — arrows or a sideways scroll/swipe move one round.
              Desktop only; the mobile view navigates via round tabs instead. */}
          <div className="hidden shrink-0 items-center gap-2 md:flex">
            <div
              className="font-heading hidden text-[9px] font-bold tracking-[2px] uppercase sm:block"
              style={{ color: `${theme.accent}45` }}>
              Scroll sideways · one round
            </div>
            <button
              type="button"
              onClick={() => stepFocus(-1)}
              disabled={focus === 0}
              aria-label="Previous round"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-30"
              style={{ background: `${theme.accent}12`, border: `1px solid ${theme.accent}26` }}>
              <ChevronLeft size={17} style={{ color: theme.accent }} />
            </button>
            <button
              type="button"
              onClick={() => stepFocus(1)}
              disabled={focus === lastIndex}
              aria-label="Next round"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-30"
              style={{ background: `${theme.accent}12`, border: `1px solid ${theme.accent}26` }}>
              <ChevronRight size={17} style={{ color: theme.accent }} />
            </button>
          </div>
        </div>

        {/* Exactly one bracket variant mounts — the desktop tree or the mobile
            bracket — never both (mounting both made the Knockout tab sluggish). */}
        {isMobile ? (
          <MobileBracket
            rounds={rounds}
            ownerByTeam={ownerByTeam}
            theme={theme}
            championTeam={championTeam}
            championOwner={championOwner}
          />
        ) : (
          /* Rail (collapsed passed rounds) + focused tree — desktop only */
          <div className="relative z-10 flex gap-2 md:gap-3">
            {passedRounds.length > 0 ? (
              <div
                className="flex shrink-0 gap-1.5 pr-1"
                style={{ width: railWidth, height }}
                aria-label="Completed rounds — tap to revisit">
                {passedRounds.map((round, index) => (
                  <RailColumn
                    key={round.key}
                    round={round}
                    theme={theme}
                    onClick={() => goToFocus(index)}
                  />
                ))}
              </div>
            ) : null}

            {/* Clip the off-screen rounds; horizontal gestures step focus, vertical
              gestures pass through to the page (touch-action: pan-y). */}
            <div
              ref={wrapRef}
              className="relative grow overflow-hidden"
              style={{ height, touchAction: 'pan-y' }}>
              <div ref={treeRef} className="relative" style={{ width: totalWidth, height }}>
                <svg
                  ref={svgRef}
                  className="pointer-events-none absolute inset-0 h-full w-full"
                  fill="none"
                  aria-hidden="true">
                  <defs>
                    <linearGradient id={flowId} x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={`${theme.accent}38`} />
                      <stop offset="55%" stopColor={`${theme.accent}80`} />
                      <stop offset="100%" stopColor={theme.accent} />
                    </linearGradient>
                  </defs>
                  {positionedRounds.slice(0, -1).flatMap((round, roundIndex) =>
                    round.flatMap((source, matchIndex) => {
                      if (matchIndex % 2 !== 0) return [];
                      const sibling = round[matchIndex + 1];
                      const target = positionedRounds[roundIndex + 1][Math.floor(matchIndex / 2)];
                      if (!sibling || !target) return [];
                      const startX = source.x + CARD_WIDTH;
                      const endX = target.x;
                      const topY = source.centerY + STAGE_OFFSET;
                      const botY = sibling.centerY + STAGE_OFFSET;
                      const midY = target.centerY + STAGE_OFFSET;
                      const dTop = elbowPath(startX, topY, endX, midY);
                      const dBot = elbowPath(startX, botY, endX, midY);
                      const k = source.match.match;
                      return [
                        <path
                          key={`gt-${k}`}
                          data-conn={`gt-${k}`}
                          d={dTop}
                          stroke={theme.accent}
                          strokeOpacity={0.1}
                          strokeWidth={6}
                          strokeLinecap="round"
                        />,
                        <path
                          key={`gb-${k}`}
                          data-conn={`gb-${k}`}
                          d={dBot}
                          stroke={theme.accent}
                          strokeOpacity={0.1}
                          strokeWidth={6}
                          strokeLinecap="round"
                        />,
                        <path
                          key={`t-${k}`}
                          data-conn={`t-${k}`}
                          d={dTop}
                          stroke={`url(#${flowId})`}
                          strokeWidth={2}
                          strokeLinecap="round"
                        />,
                        <path
                          key={`b-${k}`}
                          data-conn={`b-${k}`}
                          d={dBot}
                          stroke={`url(#${flowId})`}
                          strokeWidth={2}
                          strokeLinecap="round"
                        />,
                      ];
                    })
                  )}
                  {finalPos ? (
                    <>
                      <path
                        data-conn="champ-glow"
                        d={elbowPath(finalPos.x + CARD_WIDTH, champCenterY, champX, champCenterY)}
                        style={{ stroke: GOLD, strokeOpacity: 0.16 }}
                        strokeWidth={8}
                        strokeLinecap="round"
                      />
                      <path
                        data-conn="champ"
                        d={elbowPath(finalPos.x + CARD_WIDTH, champCenterY, champX, champCenterY)}
                        style={{ stroke: GOLD }}
                        strokeWidth={2.5}
                        strokeLinecap="round"
                      />
                    </>
                  ) : null}
                </svg>

                {/* Headers and cards are FLAT children of the tree so that when a
                  round leaves, only its own elements are removed — their parent
                  persists, letting Flip re-insert and animate them out. */}
                {visibleRounds.flatMap((round, roundIndex) => {
                  const x = PADDING + roundIndex * COLUMN_STRIDE;
                  return [
                    <div
                      key={`hdr-${round.key}`}
                      className="absolute z-10"
                      data-flip-id={`hdr-${round.key}`}
                      style={{ left: x, top: 0, width: CARD_WIDTH }}>
                      <div
                        className="rounded-full px-3 py-2 text-center backdrop-blur-sm"
                        style={{
                          background: `${theme.accent}10`,
                          border: '1px solid var(--card-border)',
                        }}>
                        <div
                          className="font-heading text-[8px] font-bold tracking-[2px] uppercase"
                          style={{ color: `${theme.accent}55` }}>
                          {round.shortTitle}
                        </div>
                        <div
                          className="font-display mt-0.5 text-sm"
                          style={{ color: theme.accent }}>
                          {round.title}
                        </div>
                      </div>
                    </div>,
                    ...positionedRounds[roundIndex].map(({ match, x: matchX, y }) => (
                      <div
                        key={match.match}
                        className="absolute z-10"
                        data-flip-id={`m-${match.match}`}
                        style={{ left: matchX, top: y + STAGE_OFFSET }}>
                        <MatchCard match={match} ownerByTeam={ownerByTeam} theme={theme} />
                      </div>
                    )),
                  ];
                })}

                {finalPos ? (
                  <>
                    <div
                      className="absolute z-10"
                      data-flip-id="champion-header"
                      style={{ left: champX, top: 0, width: CHAMP_WIDTH }}>
                      <div
                        className="rounded-full px-3 py-2 text-center"
                        style={{
                          background: `color-mix(in srgb, ${GOLD} 12%, transparent)`,
                          border: `1px solid color-mix(in srgb, ${GOLD} 38%, transparent)`,
                        }}>
                        <div
                          className="font-heading text-[8px] font-bold tracking-[2px] uppercase"
                          style={{ color: `color-mix(in srgb, ${GOLD} 75%, transparent)` }}>
                          Winner
                        </div>
                        <div className="font-display mt-0.5 text-sm" style={{ color: GOLD }}>
                          Champion
                        </div>
                      </div>
                    </div>
                    <div
                      className="absolute z-10"
                      data-flip-id="champion"
                      style={{ left: champX, top: champCenterY - CHAMP_HEIGHT / 2 }}>
                      <ChampionCard
                        team={championTeam}
                        owner={championOwner}
                        theme={theme}
                        width={CHAMP_WIDTH}
                      />
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
