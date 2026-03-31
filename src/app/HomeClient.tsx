'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useCallback, useEffect, useRef, useState } from 'react';

import { FixturesTab } from '@/components/fixtures/FixturesTab';
import { GroupsTab } from '@/components/groups/GroupsTab';
import { Header } from '@/components/layout/Header';
import { Nav } from '@/components/layout/Nav';
import { Stickers } from '@/components/layout/Stickers';
import { LeaderboardTab } from '@/components/leaderboard/LeaderboardTab';
import { TeamsTab } from '@/components/teams/TeamsTab';
import { THEMES } from '@/data/themes';
import type { SweepstakeData } from '@/lib/load-data';
import { useSmoothScroll } from '@/lib/use-smooth-scroll';
import type { TabKey } from '@/types';

gsap.registerPlugin(ScrollTrigger);

type Props = { data: SweepstakeData };

export default function HomeClient({ data }: Props) {
  const [tab, setTab] = useState<TabKey>('Leaderboard');
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const wipeRef = useRef<HTMLDivElement>(null);
  const safeTopRef = useRef<HTMLDivElement>(null);
  const safeBottomRef = useRef<HTMLDivElement>(null);
  const isTransitioning = useRef(false);
  const theme = THEMES[tab];

  useSmoothScroll();

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  // Apply theme colors
  useEffect(() => {
    document.documentElement.style.background = theme.bg;
    document.body.style.background = theme.bg;
    document.body.style.transition = 'background 0.6s cubic-bezier(0.32, 0.72, 0, 1)';
    document.documentElement.style.setProperty('--theme-bg', theme.bg);
    document.documentElement.style.setProperty('--theme-accent', theme.accent);
    document.documentElement.style.setProperty('--theme-accent2', theme.accent2);
    document.documentElement.style.setProperty('--theme-card', theme.card);
    // Sync safe area bar colors
    if (safeTopRef.current) safeTopRef.current.style.background = theme.bg;
    if (safeBottomRef.current) safeBottomRef.current.style.background = theme.bg;
  }, [theme]);

  // GSAP reveal on tab change
  useEffect(() => {
    if (!contentRef.current) return;
    const els = contentRef.current.querySelectorAll('[data-reveal]');
    if (!els.length) return;

    gsap.set(els, { y: 40, opacity: 0 });
    const tl = gsap.to(els, {
      y: 0,
      opacity: 1,
      duration: 0.8,
      stagger: 0.07,
      ease: 'expo.out',
      delay: 0.15,
    });

    return () => {
      tl.kill();
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, [tab]);

  /** Update the meta theme-color for mobile safe areas */
  const updateThemeColor = useCallback((color: string) => {
    let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = color;
  }, []);

  // Keep theme-color in sync
  useEffect(() => {
    updateThemeColor(theme.bg);
  }, [theme, updateThemeColor]);

  /**
   * Circle wipe transition — the correct sequence:
   *
   * 1. Wipe expands from center in the NEXT theme's color.
   *    It sits at z-200, above the nav (z-100) and mobile menu (z-95).
   *    The current page + open menu stay untouched underneath.
   *
   * 2. Once wipe fully covers the screen (onComplete):
   *    - Close menu (invisible under wipe)
   *    - Unlock body scroll (was locked by menu)
   *    - Scroll to top (invisible under wipe)
   *    - Update body bg, CSS vars, theme-color (invisible under wipe)
   *    - Set new tab → React re-renders new content (invisible under wipe)
   *
   * 3. Wait a frame for React to paint, then dissolve the wipe.
   *    User sees: new page, at top, correct colors, menu closed.
   */
  const handleTabChange = useCallback(
    (newTab: TabKey) => {
      if (newTab === tab || !wipeRef.current || isTransitioning.current) return;
      isTransitioning.current = true;
      const nextTheme = THEMES[newTab];

      // Phase 1: Expand wipe over everything (including open mobile menu)
      const el = wipeRef.current;
      el.style.background = nextTheme.bg;

      // Update safe area bars IMMEDIATELY — these are DOM elements we control,
      // no browser animation delay unlike theme-color meta
      if (safeTopRef.current) safeTopRef.current.style.background = nextTheme.bg;
      if (safeBottomRef.current) safeBottomRef.current.style.background = nextTheme.bg;
      updateThemeColor(nextTheme.bg);
      document.documentElement.style.background = nextTheme.bg;
      document.body.style.transition = 'none';
      document.body.style.background = nextTheme.bg;

      gsap.set(el, {
        clipPath: 'circle(0% at 50% 50%)',
        opacity: 1,
        pointerEvents: 'auto',
      });

      gsap.to(el, {
        clipPath: 'circle(150% at 50% 50%)',
        duration: 0.7,
        ease: 'power3.inOut',
        onComplete: () => {
          // Phase 2: Everything happens under the wipe — user sees nothing

          // Close the mobile menu
          setMenuOpen(false);

          // Unlock body scroll (menu had it locked)
          document.body.style.overflow = '';

          // Scroll to top
          window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });

          // Update CSS vars (invisible under wipe — body/html bg already set at wipe start)
          document.documentElement.style.setProperty('--theme-bg', nextTheme.bg);
          document.documentElement.style.setProperty('--theme-accent', nextTheme.accent);
          document.documentElement.style.setProperty('--theme-accent2', nextTheme.accent2);
          document.documentElement.style.setProperty('--theme-card', nextTheme.card);

          // Swap tab — triggers React re-render
          setTab(newTab);

          // Phase 3: Wait for React to paint, then dissolve wipe
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              document.body.style.transition = 'background 0.6s cubic-bezier(0.32, 0.72, 0, 1)';

              gsap.to(el, {
                opacity: 0,
                duration: 0.35,
                ease: 'power2.out',
                onComplete: () => {
                  el.style.pointerEvents = 'none';
                  isTransitioning.current = false;
                },
              });
            });
          });
        },
      });
    },
    [tab, updateThemeColor]
  );

  return (
    <div className="relative min-h-screen">
      <Stickers theme={theme} />

      <div className="relative z-10">
        <Nav
          activeTab={tab}
          onTabChange={handleTabChange}
          theme={theme}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
        />

        {/* Full-viewport sticky hero */}
        <Header theme={theme} visible={mounted} tab={tab} />

        {/* Content — slides over hero with solid background */}
        <div
          className="content-surface relative z-20"
          style={{
            background: theme.bg,
            transition: 'background 0.6s cubic-bezier(0.32, 0.72, 0, 1)',
          }}>
          {/* Soft edge gradient that bleeds up into the hero */}
          <div
            className="pointer-events-none absolute inset-x-0 z-10 h-24 md:h-36"
            style={{
              top: '-5rem',
              background: `linear-gradient(to bottom, transparent, ${theme.bg} 85%)`,
              transition: 'background 0.6s',
            }}
          />

          {/* Accent line */}
          <div
            className="mx-auto h-px max-w-50 md:max-w-70"
            style={{
              background: `linear-gradient(90deg, transparent, ${theme.accent}18, transparent)`,
            }}
          />

          <div
            ref={contentRef}
            className="mx-auto max-w-285 px-4 pt-8 pb-20 md:px-6 md:pt-12 md:pb-28 lg:px-8">
            {tab === 'Leaderboard' && <LeaderboardTab entries={data.leaderboard} theme={theme} />}
            {tab === 'Fixtures' && <FixturesTab fixtures={data.fixtures} theme={theme} />}
            {tab === 'Groups' && <GroupsTab standings={data.standings} theme={theme} />}
            {tab === 'Teams' && (
              <TeamsTab entries={data.leaderboard} fixtures={data.fixtures} theme={theme} />
            )}
          </div>

          {/* Footer */}
          <footer className="px-5 pt-12 pb-8 text-center md:pt-16 md:pb-10">
            <div
              className="mx-auto mb-8 h-px max-w-40"
              style={{ background: `${theme.accent}12` }}
            />
            <div className="headline-s mb-2" style={{ color: `${theme.accent}15` }}>
              WORLD CUP 2026
            </div>
            <div
              className="font-heading text-[10px] font-medium tracking-[3px] md:text-[11px]"
              style={{ color: 'rgba(255,255,255,0.1)' }}>
              USA · MEXICO · CANADA
            </div>
            <div
              className="mt-5 text-[8px] uppercase tracking-[3px]"
              style={{ color: 'rgba(255,255,255,0.06)' }}>
              {data.dataSource === 'live' ? '● LIVE' : '○ STATIC'} ·{' '}
              {new Date(data.fetchedAt).toLocaleTimeString()}
            </div>
          </footer>
        </div>
      </div>

      {/* Circle wipe overlay — z-200 = above nav (z-100), menu (z-95), everything */}
      <div
        ref={wipeRef}
        className="fixed inset-0 z-200"
        style={{ opacity: 0, pointerEvents: 'none', willChange: 'clip-path, opacity' }}
      />

      {/*
        Safe area covers — our own colored bars that sit IN the safe area insets.
        These replace the browser's theme-color painting, which has an uncontrollable delay.
        With viewport-fit: cover, our content extends behind the notch/home indicator.
        These bars sit at z-[300] (above the wipe) and we change their color
        at wipe START, so they're instantly correct — no browser delay.
      */}
      <div
        ref={safeTopRef}
        className="safe-area-top pointer-events-none fixed top-0 right-0 left-0 z-300"
        style={{ background: theme.bg }}
      />
      <div
        ref={safeBottomRef}
        className="safe-area-bottom pointer-events-none fixed right-0 bottom-0 left-0 z-300"
        style={{ background: theme.bg }}
      />
    </div>
  );
}
