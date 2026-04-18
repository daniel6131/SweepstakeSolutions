import type { ThemeColors } from '@/types';
import { SplitChars } from './primitives/SplitChars';

export function LeaderboardHero({ theme }: { theme: ThemeColors }) {
  return (
    <div className="relative flex flex-col items-center">
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

      <div className="relative overflow-visible py-3 md:py-4" data-parallax-layer="mid">
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

      <div
        className="relative font-heading text-[11px] font-semibold uppercase tracking-[6px] md:text-sm md:tracking-[8px]"
        style={{ color: `${theme.accent}35`, animation: 'hero-fade-in 0.8s ease 1.1s both' }}
        data-parallax-layer="front">
        AWAITS
      </div>

      <div
        className="mx-auto mt-4 h-px w-16 md:mt-5 md:w-28"
        style={{
          background: `linear-gradient(90deg, transparent, ${theme.accent}60, transparent)`,
          animation: 'line-draw 1s var(--ease-emphasized) 1s both',
          transformOrigin: 'center',
        }}
        data-parallax-layer="front"
      />
    </div>
  );
}
