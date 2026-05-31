'use client';

import type { ThemeColors } from '@/types';
import { useEffect, useState } from 'react';

export function TeamsHero({ theme }: { theme: ThemeColors }) {
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
      <div
        className="relative font-display leading-none"
        data-parallax-layer="mid"
        style={{
          fontSize: 'clamp(100px, 30vw, 280px)',
          letterSpacing: '-0.03em',
          textShadow: `0 0 72px ${theme.accent}33`,
          ...(shimmerDone
            ? { color: 'var(--color-fg)', transition: 'color 0.6s ease' }
            : settled
              ? {
                  background: `linear-gradient(90deg, ${theme.accent}66, var(--color-fg), ${theme.accent}66)`,
                  backgroundSize: '200% 100%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  animation: 'text-shimmer 2s ease-out both',
                }
              : { color: theme.accent }),
        }}>
        {count}
      </div>

      <div
        className="mt-3 flex items-center gap-3 self-start md:mt-4"
        data-parallax-layer="front"
        style={{ animation: 'hero-fade-in 0.7s ease 1.5s both' }}>
        <span
          className="block h-0.75 w-10 md:w-16"
          style={{
            background: theme.accent,
            animation: 'line-draw 0.9s var(--ease-emphasized) 1.5s both',
            transformOrigin: 'left',
          }}
        />
        <span
          className="font-heading text-[10px] font-semibold uppercase md:text-xs"
          style={{ color: 'var(--color-fg-muted)', letterSpacing: '0.32em' }}>
          48 Nations · 12 Squads
        </span>
      </div>
    </div>
  );
}
