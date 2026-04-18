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

      <div
        className="relative mt-2 font-heading text-[11px] font-semibold uppercase tracking-[6px] md:mt-3 md:text-sm md:tracking-[8px]"
        style={{ color: `${theme.accent}35`, animation: 'hero-fade-in 0.7s ease 1.5s both' }}
        data-parallax-layer="front">
        NATIONS · 1 LEGEND
      </div>
    </div>
  );
}
