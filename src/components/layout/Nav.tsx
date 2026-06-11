'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { THEMES } from '@/data/themes';
import type { TabKey, ThemeColors } from '@/types';

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
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const firstMenuItemRef = useRef<HTMLButtonElement>(null);
  const lastMenuItemRef = useRef<HTMLButtonElement>(null);
  const tabRefs = useRef<Partial<Record<TabKey, HTMLButtonElement | null>>>({});
  const pillRef = useRef<HTMLSpanElement>(null);
  const firstPillMove = useRef(true);
  const [hovered, setHovered] = useState<TabKey | null>(null);

  // Lock body scroll when menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  // Focus first menu item when menu opens; restore hamburger when it closes.
  // Skip the initial mount so nothing is auto-focused on page load (otherwise
  // the hamburger shows a focus ring before the user has interacted).
  const menuWasMounted = useRef(false);
  useEffect(() => {
    if (!menuWasMounted.current) {
      menuWasMounted.current = true;
      return;
    }
    if (menuOpen) {
      firstMenuItemRef.current?.focus();
    } else {
      hamburgerRef.current?.focus();
    }
  }, [menuOpen]);

  // Focus trap + ESC inside mobile menu
  const handleMenuKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        return;
      }
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === firstMenuItemRef.current) {
          e.preventDefault();
          lastMenuItemRef.current?.focus();
        }
      } else {
        if (document.activeElement === lastMenuItemRef.current) {
          e.preventDefault();
          firstMenuItemRef.current?.focus();
        }
      }
    },
    [setMenuOpen]
  );

  // Slide the indicator pill to a tab's box (DOM-direct so React re-renders
  // don't clobber it; the first move snaps without animating).
  const movePill = useCallback((tab: TabKey) => {
    const btn = tabRefs.current[tab];
    const pill = pillRef.current;
    if (!btn || !pill) return;
    if (firstPillMove.current) pill.style.transition = 'none';
    pill.style.width = `${btn.offsetWidth}px`;
    pill.style.height = `${btn.offsetHeight}px`;
    pill.style.transform = `translate(${btn.offsetLeft}px, -50%)`;
    pill.style.opacity = '1';
    if (firstPillMove.current) {
      void pill.offsetWidth; // reflow before re-enabling the slide transition
      pill.style.transition = '';
      firstPillMove.current = false;
    }
  }, []);

  // Pill follows the hovered tab, or rests on the active one.
  useEffect(() => {
    const target = hovered ?? activeTab;
    movePill(target);
    void document.fonts?.ready.then(() => movePill(target));
  }, [hovered, activeTab, movePill]);

  useEffect(() => {
    const onResize = () => movePill(hovered ?? activeTab);
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, [hovered, activeTab, movePill]);

  const handleDesktopSelect = (tab: TabKey) => {
    onTabChange(tab);
  };

  const handleMobileSelect = (tab: TabKey) => {
    // Do NOT close menu here — the wipe in HomeClient will cover the menu,
    // then close it under the wipe. Menu stays visible while wipe expands over it.
    onTabChange(tab);
  };

  return (
    <>
      <nav
        aria-label="Main navigation"
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
          {/* Wordmark */}
          <div
            className="font-display text-[13px] tracking-[1px] md:text-[15px]"
            style={{ color: theme.accent }}
            aria-label="World Cup 2026 Sweepstake">
            WC 2026
          </div>

          {/* Desktop tab list — bold sliding knockout block */}
          <div role="tablist" aria-label="View" className="relative hidden items-center md:flex">
            <span
              ref={pillRef}
              aria-hidden="true"
              className="nav-indicator pointer-events-none absolute top-1/2 left-0 opacity-0"
              style={{
                background: theme.accent,
                clipPath: 'polygon(9px 0, 100% 0, calc(100% - 9px) 100%, 0 100%)',
                filter: `drop-shadow(0 4px 16px ${theme.accent}66)`,
              }}
            />
            {TABS.map((tab) => {
              const lit = tab === (hovered ?? activeTab);
              return (
                <button
                  key={tab}
                  ref={(el) => {
                    tabRefs.current[tab] = el;
                  }}
                  role="tab"
                  aria-selected={activeTab === tab}
                  onClick={() => handleDesktopSelect(tab)}
                  onPointerEnter={() => setHovered(tab)}
                  onPointerLeave={() => setHovered(null)}
                  className="font-heading relative z-10 cursor-pointer px-4 py-2 text-[12px] font-bold uppercase tracking-[2.5px] transition-colors duration-200"
                  style={{ color: lit ? theme.bg : 'var(--color-fg-subtle)' }}>
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Right — status dot */}
          <div className="hidden items-center gap-3 md:flex" aria-hidden="true">
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
            ref={hamburgerRef}
            onClick={() => setMenuOpen(!menuOpen)}
            className="relative flex h-10 w-10 items-center justify-center md:hidden"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav">
            <span
              className="absolute block h-[1.5px] w-5 rounded-full transition-all duration-400"
              style={{
                background: menuOpen ? theme.accent : 'var(--color-fg-muted)',
                transform: menuOpen ? 'rotate(45deg)' : 'translateY(-3px)',
                transitionTimingFunction: 'cubic-bezier(0.19, 1, 0.22, 1)',
              }}
              aria-hidden="true"
            />
            <span
              className="absolute block h-[1.5px] w-5 rounded-full transition-all duration-400"
              style={{
                background: menuOpen ? theme.accent : 'var(--color-fg-muted)',
                transform: menuOpen ? 'rotate(-45deg)' : 'translateY(3px)',
                transitionTimingFunction: 'cubic-bezier(0.19, 1, 0.22, 1)',
              }}
              aria-hidden="true"
            />
          </button>
        </div>
      </nav>

      {/* Mobile full-screen menu */}
      <div
        id="mobile-nav"
        role="dialog"
        aria-label="Navigation menu"
        aria-modal="true"
        aria-hidden={!menuOpen}
        onKeyDown={handleMenuKeyDown}
        className={`mobile-menu-overlay ${menuOpen ? 'is-open' : ''}`}>
        <div role="tablist" aria-label="View" className="flex flex-col items-center gap-3">
          {TABS.map((tab, i) => {
            const active = activeTab === tab;
            const t = THEMES[tab];
            const isFirst = i === 0;
            const isLast = i === TABS.length - 1;
            return (
              <button
                key={tab}
                ref={isFirst ? firstMenuItemRef : isLast ? lastMenuItemRef : undefined}
                role="tab"
                aria-selected={active}
                tabIndex={menuOpen ? 0 : -1}
                onClick={() => handleMobileSelect(tab)}
                className="font-display cursor-pointer text-center transition-all duration-500"
                style={{
                  fontSize: 48,
                  color: active ? t.accent : 'var(--color-fg-subtle)',
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

        <div
          className="font-heading absolute bottom-10 text-[10px] font-semibold uppercase tracking-[3px]"
          style={{ color: 'var(--color-fg-subtle)' }}
          aria-hidden="true">
          World Cup Sweepstake 2026
        </div>
      </div>
    </>
  );
}

function useScrolled() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return scrolled;
}
