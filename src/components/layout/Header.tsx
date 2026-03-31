'use client';

import type { TabKey, ThemeColors } from '@/types';
import { useCallback, useEffect, useRef, useState } from 'react';

type HeaderProps = { theme: ThemeColors; visible: boolean; tab: TabKey };

/* ═══════════════════════════════════════════════════════════
   Animation primitives
   ═══════════════════════════════════════════════════════════ */

function SplitChars({
  text,
  className,
  charStyle,
  stagger = 0.06,
  delay = 0.15,
  animName = 'char-rise',
  duration = '1s',
  easing = 'cubic-bezier(0.19, 1, 0.22, 1)',
}: {
  text: string;
  className?: string;
  charStyle?: React.CSSProperties;
  stagger?: number;
  delay?: number;
  animName?: string;
  duration?: string;
  easing?: string;
}) {
  return (
    <span className={`inline-flex items-baseline justify-center ${className ?? ''}`}>
      {text.split('').map((char, i) => (
        <span
          key={`${char}-${i}`}
          className="inline-block"
          style={{
            opacity: 0,
            animation: `${animName} ${duration} ${easing} both`,
            animationDelay: `${delay + i * stagger}s`,
            willChange: 'transform, opacity',
            ...charStyle,
          }}>
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </span>
  );
}

function ClipReveal({
  children,
  delay,
  duration = '0.9s',
  className,
  style,
}: {
  children: React.ReactNode;
  delay: number;
  duration?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span className="inline-block overflow-hidden align-bottom" style={{ lineHeight: 1 }}>
      <span
        className={`inline-block ${className ?? ''}`}
        style={{
          opacity: 0,
          animation: `word-clip-up ${duration} cubic-bezier(0.19, 1, 0.22, 1) both`,
          animationDelay: `${delay}s`,
          willChange: 'transform, opacity',
          ...style,
        }}>
        {children}
      </span>
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════
   Per-tab hero visuals — VIEWPORT SCALE
   ═══════════════════════════════════════════════════════════ */

function LeaderboardHero({ theme }: { theme: ThemeColors }) {
  return (
    <div className="relative flex flex-col items-center">
      {/* Background watermark — massive, behind everything */}
      <div
        className="pointer-events-none absolute font-display leading-none"
        style={{
          fontSize: 'clamp(120px, 40vw, 400px)',
          color: `${theme.accent}04`,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          letterSpacing: '-0.04em',
          userSelect: 'none',
        }}
        data-parallax-layer="bg">
        2026
      </div>

      {/* Main text */}
      <div className="relative overflow-hidden py-2" data-parallax-layer="mid">
        <SplitChars
          text="GLORY"
          className="font-display tracking-[-0.04em]"
          stagger={0.07}
          delay={0.35}
          duration="1.1s"
          charStyle={{
            fontSize: 'clamp(90px, 24vw, 240px)',
            lineHeight: '0.85',
            WebkitTextStroke: `2px ${theme.accent}`,
            WebkitTextFillColor: 'transparent',
            color: 'transparent',
          }}
        />
      </div>

      {/* Sub line */}
      <div
        className="relative font-heading text-[11px] font-semibold uppercase tracking-[6px] md:text-sm md:tracking-[8px]"
        style={{ color: `${theme.accent}35`, animation: 'hero-fade-in 0.8s ease 1.1s both' }}
        data-parallax-layer="front">
        AWAITS
      </div>

      {/* Accent line */}
      <div
        className="mx-auto mt-4 h-px w-16 md:mt-5 md:w-28"
        style={{
          background: `linear-gradient(90deg, transparent, ${theme.accent}60, transparent)`,
          animation: 'line-draw 1s cubic-bezier(0.19, 1, 0.22, 1) 1s both',
          transformOrigin: 'center',
        }}
        data-parallax-layer="front"
      />
    </div>
  );
}

function FixturesHero({ theme }: { theme: ThemeColors }) {
  return (
    <div className="relative flex flex-col items-center">
      {/* Background watermark */}
      <div
        className="pointer-events-none absolute font-display leading-none"
        style={{
          fontSize: 'clamp(100px, 35vw, 360px)',
          color: `${theme.accent}04`,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          letterSpacing: '-0.02em',
          userSelect: 'none',
        }}
        data-parallax-layer="bg">
        MATCH
      </div>

      {/* Main words */}
      <div
        className="relative flex flex-col items-center gap-1 md:flex-row md:gap-4"
        data-parallax-layer="mid">
        <ClipReveal
          delay={0.3}
          className="font-display"
          style={{
            fontSize: 'clamp(56px, 15vw, 140px)',
            color: theme.accent,
            letterSpacing: '-0.02em',
          }}>
          EVERY
        </ClipReveal>

        {/* Dot — only visible on desktop row layout */}
        <span
          className="hidden rounded-full md:inline-block"
          style={{
            width: 10,
            height: 10,
            background: theme.accent,
            animation: 'dot-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.7s both',
          }}
        />

        <ClipReveal
          delay={0.5}
          className="font-display"
          style={{
            fontSize: 'clamp(56px, 15vw, 140px)',
            color: theme.accent,
            letterSpacing: '-0.02em',
          }}>
          GOAL
        </ClipReveal>
      </div>

      {/* Sub text */}
      <div
        className="relative mt-2 font-heading text-[11px] font-semibold uppercase tracking-[6px] md:mt-3 md:text-sm md:tracking-[8px]"
        style={{ color: `${theme.accent}35`, animation: 'hero-fade-in 0.8s ease 1s both' }}
        data-parallax-layer="front">
        COUNTS
      </div>
    </div>
  );
}

function GroupsHero({ theme }: { theme: ThemeColors }) {
  const groups = 'ABCDEFGHIJKL'.split('');

  return (
    <div className="relative flex flex-col items-center">
      {/* Background watermark */}
      <div
        className="pointer-events-none absolute font-display leading-none"
        style={{
          fontSize: 'clamp(100px, 35vw, 360px)',
          color: `${theme.accent}04`,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          letterSpacing: '-0.02em',
          userSelect: 'none',
        }}
        data-parallax-layer="bg">
        DRAW
      </div>

      {/* Big title */}
      <div className="relative overflow-hidden py-1 mb-5 md:mb-7" data-parallax-layer="mid">
        <SplitChars
          text="GROUPS"
          className="font-display tracking-[-0.03em]"
          stagger={0.06}
          delay={0.3}
          duration="1s"
          charStyle={{
            fontSize: 'clamp(60px, 17vw, 160px)',
            lineHeight: '0.85',
            WebkitTextStroke: `2px ${theme.accent}`,
            WebkitTextFillColor: 'transparent',
            color: 'transparent',
          }}
        />
      </div>

      {/* Badges */}
      <div
        className="relative flex flex-wrap items-center justify-center gap-2 md:gap-3"
        data-parallax-layer="front">
        {groups.map((g, i) => (
          <div
            key={g}
            className="font-display flex items-center justify-center rounded-lg text-base md:rounded-xl md:text-lg"
            style={{
              width: 'clamp(36px, 6vw, 50px)',
              height: 'clamp(36px, 6vw, 50px)',
              background: `${theme.accent}08`,
              border: `1.5px solid ${theme.accent}18`,
              color: theme.accent,
              animation: `badge-pop 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) ${0.6 + i * 0.04}s both, badge-glow 2.5s ease-in-out ${1.6 + i * 0.12}s 1`,
              willChange: 'transform, opacity',
            }}>
            {g}
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamsHero({ theme }: { theme: ThemeColors }) {
  const target = 48;
  const [count, setCount] = useState(0);
  const [settled, setSettled] = useState(false);
  const [shimmerDone, setShimmerDone] = useState(false);

  useEffect(() => {
    const dur = 1300;
    const start = performance.now();
    let frame: number;
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      setCount(Math.round((1 - Math.pow(1 - p, 4)) * target));
      if (p < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        setSettled(true);
        setTimeout(() => setShimmerDone(true), 2000);
      }
    };
    const d = setTimeout(() => {
      frame = requestAnimationFrame(tick);
    }, 400);
    return () => {
      clearTimeout(d);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="relative flex flex-col items-center">
      {/* Background watermark */}
      <div
        className="pointer-events-none absolute font-display leading-none"
        style={{
          fontSize: 'clamp(100px, 35vw, 360px)',
          color: `${theme.accent}04`,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          letterSpacing: '-0.02em',
          userSelect: 'none',
        }}
        data-parallax-layer="bg">
        SQUAD
      </div>

      {/* Counter */}
      <div
        className="relative font-display leading-none"
        data-parallax-layer="mid"
        style={{
          fontSize: 'clamp(100px, 30vw, 280px)',
          ...(shimmerDone
            ? { color: theme.accent, transition: 'color 0.6s ease' }
            : settled
              ? {
                  background: `linear-gradient(90deg, ${theme.accent}55, ${theme.accent}, ${theme.accent}55)`,
                  backgroundSize: '200% 100%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  animation: 'text-shimmer 2s ease-out both',
                }
              : { color: theme.accent }),
        }}>
        {count}
      </div>

      {/* Sub text */}
      <div
        className="relative mt-2 font-heading text-[11px] font-semibold uppercase tracking-[6px] md:mt-3 md:text-sm md:tracking-[8px]"
        style={{ color: `${theme.accent}35`, animation: 'hero-fade-in 0.7s ease 1.5s both' }}
        data-parallax-layer="front">
        NATIONS · 1 LEGEND
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Scroll Indicator
   ═══════════════════════════════════════════════════════════ */

function ScrollIndicator({ theme }: { theme: ThemeColors }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="font-heading text-[8px] font-semibold uppercase tracking-[4px] md:text-[9px]"
        style={{ color: `${theme.accent}30` }}>
        SCROLL
      </div>
      <div className="scroll-chevron" style={{ color: `${theme.accent}40` }}>
        <svg width="14" height="8" viewBox="0 0 14 8" fill="none">
          <path
            d="M1 1L7 7L13 1"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Header — Full viewport sticky hero, multi-layer parallax
   ═══════════════════════════════════════════════════════════ */

export function Header({ theme, visible, tab }: HeaderProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<{ bg: HTMLElement[]; mid: HTMLElement[]; front: HTMLElement[] }>({
    bg: [],
    mid: [],
    front: [],
  });
  const rafId = useRef(0);

  // Collect parallax layers after mount/tab change
  useEffect(() => {
    if (!stickyRef.current) return;
    layersRef.current = {
      bg: Array.from(stickyRef.current.querySelectorAll('[data-parallax-layer="bg"]')),
      mid: Array.from(stickyRef.current.querySelectorAll('[data-parallax-layer="mid"]')),
      front: Array.from(stickyRef.current.querySelectorAll('[data-parallax-layer="front"]')),
    };
  }, [tab]);

  const handleScroll = useCallback(() => {
    cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      if (!heroRef.current || !stickyRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.max(0, Math.min(1, -rect.top / vh));

      // Overall fade
      stickyRef.current.style.opacity = String(visible ? Math.max(0, 1 - p * 1.8) : 0);

      // Multi-speed parallax: bg moves slow, mid medium, front fast
      const { bg, mid, front } = layersRef.current;
      const bgY = p * -40;
      const midY = p * -120;
      const midScale = 1 - p * 0.15;
      const frontY = p * -180;

      bg.forEach((el) => {
        el.style.transform = `translate(-50%, calc(-50% + ${bgY}px))`;
      });
      mid.forEach((el) => {
        el.style.transform = `translateY(${midY}px) scale(${midScale})`;
      });
      front.forEach((el) => {
        el.style.transform = `translateY(${frontY}px)`;
        el.style.opacity = String(Math.max(0, 1 - p * 3));
      });

      // Title — slow drift
      if (titleRef.current) titleRef.current.style.transform = `translateY(${p * -30}px)`;

      // Scroll indicator — vanishes fast
      if (indicatorRef.current) indicatorRef.current.style.opacity = String(Math.max(0, 1 - p * 5));
    });
  }, [visible]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId.current);
    };
  }, [handleScroll]);

  return (
    <div ref={heroRef} style={{ height: '100svh' }}>
      <div
        ref={stickyRef}
        className="sticky top-0 flex h-svh flex-col items-center justify-center overflow-hidden"
        style={{
          opacity: visible ? 1 : 0,
          transition: visible ? undefined : 'opacity 0.9s cubic-bezier(0.19, 1, 0.22, 1)',
        }}>
        {/* Everything in a single centered column — no absolute gaps */}
        <div className="flex flex-col items-center text-center px-5">
          {/* Title */}
          <div ref={titleRef} style={{ willChange: 'transform' }}>
            <h1
              className="font-display uppercase tracking-[0.04em]"
              style={{
                fontSize: 'clamp(42px, 9vw, 72px)',
                color: theme.accent,
                lineHeight: 0.9,
                transition: 'color 0.6s',
              }}>
              WORLD CUP
            </h1>
            <div
              className="font-display mt-1 uppercase tracking-[0.3em]"
              style={{
                fontSize: 'clamp(11px, 2.2vw, 18px)',
                color: `${theme.accent}20`,
                lineHeight: 1,
                transition: 'color 0.6s',
              }}>
              SWEEPSTAKE 2026
            </div>
          </div>

          {/* Per-tab hero — keyed for animation replay */}
          <div key={tab} className="relative mt-6 md:mt-10" style={{ willChange: 'transform' }}>
            {tab === 'Leaderboard' && <LeaderboardHero theme={theme} />}
            {tab === 'Fixtures' && <FixturesHero theme={theme} />}
            {tab === 'Groups' && <GroupsHero theme={theme} />}
            {tab === 'Teams' && <TeamsHero theme={theme} />}
          </div>
        </div>

        {/* Scroll indicator — pinned to bottom */}
        <div
          ref={indicatorRef}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 md:bottom-10"
          style={{ willChange: 'opacity' }}>
          <ScrollIndicator theme={theme} />
        </div>
      </div>
    </div>
  );
}
