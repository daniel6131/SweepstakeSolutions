'use client';

import { FixturesHero } from '@/components/home/hero/FixturesHero';
import { GroupsHero } from '@/components/home/hero/GroupsHero';
import { LeaderboardHero } from '@/components/home/hero/LeaderboardHero';
import { TeamsHero } from '@/components/home/hero/TeamsHero';
import { ScrollIndicator } from '@/components/home/hero/primitives/ScrollIndicator';
import type { TabKey, ThemeColors } from '@/types';
import { useCallback, useEffect, useRef } from 'react';

type HeaderProps = { theme: ThemeColors; visible: boolean; tab: TabKey };

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
      const isScrolling = p > 0;

      stickyRef.current.style.opacity = String(visible ? Math.max(0, 1 - p * 1.8) : 0);
      // Toggle will-change only while actively scrolling through the hero
      stickyRef.current.style.willChange = isScrolling ? 'opacity' : 'auto';

      const { bg, mid, front } = layersRef.current;
      const bgY = p * -40;
      const midY = p * -120;
      const midScale = 1 - p * 0.15;
      const frontY = p * -180;

      bg.forEach((el) => {
        el.style.transform = `translate(-50%, calc(-50% + ${bgY}px))`;
        el.style.willChange = isScrolling ? 'transform' : 'auto';
      });
      mid.forEach((el) => {
        el.style.transform = `translateY(${midY}px) scale(${midScale})`;
        el.style.willChange = isScrolling ? 'transform' : 'auto';
      });
      front.forEach((el) => {
        el.style.transform = `translateY(${frontY}px)`;
        el.style.opacity = String(Math.max(0, 1 - p * 3));
        el.style.willChange = isScrolling ? 'transform, opacity' : 'auto';
      });

      if (titleRef.current) {
        titleRef.current.style.transform = `translateY(${p * -30}px)`;
        titleRef.current.style.willChange = isScrolling ? 'transform' : 'auto';
      }
      if (indicatorRef.current) indicatorRef.current.style.opacity = String(Math.max(0, 1 - p * 5));
    });
  }, [visible]);

  useEffect(() => {
    // handleScroll is the only writer of the sticky hero's opacity and it runs
    // only from these listeners. Two gaps used to leave the hero blank until the
    // user scrolled:
    //   1. Viewport changes (mobile address-bar show/hide, orientation) resize the
    //      hero without firing 'scroll', so add resize + visualViewport listeners.
    //   2. After a tab switch Lenis jumps to the top via an `immediate` scrollTo,
    //      which suppresses the native 'scroll' event, so scrollPageToTop() in
    //      HomeClient dispatches a synthetic 'scroll' that these listeners catch.
    // The handleScroll() call on attach covers first load and hard navigation.
    const vv = window.visualViewport;
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    vv?.addEventListener('resize', handleScroll, { passive: true });
    vv?.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      vv?.removeEventListener('resize', handleScroll);
      vv?.removeEventListener('scroll', handleScroll);
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
        <div className="flex flex-col items-center px-5 text-center">
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

          {/*
            Mount the hero word only once `visible` is true. The entrance
            animations inside are CSS-keyframe driven (start at first paint),
            while the reveal is gated by the JS `visible` flag (set ~80ms after
            hydration). Mounting on `visible` couples the two clocks so the
            animation plays in sync with the reveal instead of finishing behind
            an `opacity:0` container on slow loads. `key` includes `visible` so
            the children remount (and re-trigger) the moment it flips.
          */}
          <div
            key={`${tab}-${visible}`}
            className="relative mt-6 md:mt-10"
            style={{ willChange: 'transform' }}>
            {visible && tab === 'Leaderboard' && <LeaderboardHero theme={theme} />}
            {visible && tab === 'Fixtures' && <FixturesHero theme={theme} />}
            {visible && tab === 'Groups' && <GroupsHero theme={theme} />}
            {visible && tab === 'Teams' && <TeamsHero theme={theme} />}
          </div>
        </div>

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
