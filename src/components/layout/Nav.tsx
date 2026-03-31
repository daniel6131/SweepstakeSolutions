'use client';

import { THEMES } from '@/data/themes';
import type { TabKey, ThemeColors } from '@/types';
import { useEffect, useState } from 'react';

const TABS: TabKey[] = ['Leaderboard', 'Fixtures', 'Groups', 'Teams'];

type NavProps = {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  theme: ThemeColors;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
};

export function Nav({ activeTab, onTabChange, theme, menuOpen, setMenuOpen }: NavProps) {
  const scrolled = useScrolled();

  // Lock body scroll when menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const handleDesktopSelect = (tab: TabKey) => {
    onTabChange(tab);
    // Desktop has no menu to worry about — wipe handles everything
  };

  const handleMobileSelect = (tab: TabKey) => {
    // Do NOT close menu here — the wipe in HomeClient will cover the menu,
    // then close it under the wipe. Menu stays visible while wipe expands over it.
    onTabChange(tab);
  };

  return (
    <>
      <nav
        className="fixed top-0 right-0 left-0 z-100 transition-all duration-500"
        style={{
          background: menuOpen
            ? theme.bg
            : scrolled
              ? `color-mix(in srgb, ${theme.bg} 85%, transparent)`
              : 'transparent',
          backdropFilter: scrolled && !menuOpen ? 'blur(16px) saturate(1.4)' : 'none',
          WebkitBackdropFilter: scrolled && !menuOpen ? 'blur(16px) saturate(1.4)' : 'none',
          borderBottom:
            scrolled && !menuOpen ? `1px solid ${theme.accent}08` : '1px solid transparent',
        }}>
        <div className="mx-auto flex h-14 max-w-300 items-center justify-between px-5 md:h-16 md:px-8">
          {/* Wordmark — left */}
          <div
            className="font-display text-[13px] tracking-[1px] md:text-[15px]"
            style={{ color: theme.accent }}>
            WC 2026
          </div>

          {/* Desktop links — center */}
          <div className="hidden items-center gap-1 md:flex">
            {TABS.map((tab) => {
              const active = activeTab === tab;
              const t = THEMES[tab];
              return (
                <button
                  key={tab}
                  onClick={() => handleDesktopSelect(tab)}
                  className="font-heading group relative cursor-pointer px-4 py-2 text-[12px] font-semibold uppercase tracking-[2.5px] transition-colors duration-300"
                  style={{ color: active ? t.accent : 'rgba(255,255,255,0.35)' }}>
                  {tab}
                  {/* Active underline indicator */}
                  <span
                    className="absolute bottom-0 left-1/2 h-0.5 -translate-x-1/2 rounded-full transition-all duration-500"
                    style={{
                      width: active ? '60%' : '0%',
                      background: t.accent,
                      opacity: active ? 1 : 0,
                      transitionTimingFunction: 'cubic-bezier(0.19, 1, 0.22, 1)',
                    }}
                  />
                </button>
              );
            })}
          </div>

          {/* Right side — status dot */}
          <div className="hidden items-center gap-3 md:flex">
            <div className="flex items-center gap-2">
              <span
                className="block h-1.5 w-1.5 rounded-full"
                style={{ background: theme.accent, opacity: 0.6 }}
              />
              <span
                className="font-heading text-[10px] font-semibold uppercase tracking-[2px]"
                style={{ color: `${theme.accent}55` }}>
                12 Players
              </span>
            </div>
          </div>

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="relative flex h-10 w-10 items-center justify-center md:hidden"
            aria-label="Toggle menu">
            <span
              className="absolute block h-[1.5px] w-5 rounded-full transition-all duration-400"
              style={{
                background: menuOpen ? theme.accent : 'rgba(255,255,255,0.6)',
                transform: menuOpen ? 'rotate(45deg)' : 'translateY(-3px)',
                transitionTimingFunction: 'cubic-bezier(0.19, 1, 0.22, 1)',
              }}
            />
            <span
              className="absolute block h-[1.5px] w-5 rounded-full transition-all duration-400"
              style={{
                background: menuOpen ? theme.accent : 'rgba(255,255,255,0.6)',
                transform: menuOpen ? 'rotate(-45deg)' : 'translateY(3px)',
                transitionTimingFunction: 'cubic-bezier(0.19, 1, 0.22, 1)',
              }}
            />
          </button>
        </div>
      </nav>

      {/* Mobile full-screen menu */}
      <div className={`mobile-menu-overlay ${menuOpen ? 'is-open' : ''}`}>
        <div className="flex flex-col items-center gap-3">
          {TABS.map((tab, i) => {
            const active = activeTab === tab;
            const t = THEMES[tab];
            return (
              <button
                key={tab}
                onClick={() => handleMobileSelect(tab)}
                className="font-display cursor-pointer text-center transition-all duration-500"
                style={{
                  fontSize: 48,
                  color: active ? t.accent : 'rgba(255,255,255,0.2)',
                  transitionDelay: menuOpen ? `${i * 60}ms` : '0ms',
                  transform: menuOpen ? 'translateY(0)' : 'translateY(20px)',
                  opacity: menuOpen ? 1 : 0,
                  transitionTimingFunction: 'cubic-bezier(0.19, 1, 0.22, 1)',
                }}>
                {tab}
              </button>
            );
          })}
        </div>

        {/* Bottom info in mobile menu */}
        <div
          className="font-heading absolute bottom-10 text-[10px] font-semibold uppercase tracking-[3px]"
          style={{ color: 'rgba(255,255,255,0.15)' }}>
          World Cup Sweepstake 2026
        </div>
      </div>
    </>
  );
}

/** Extracted scroll hook so Nav stays clean */
function useScrolled() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return scrolled;
}
