import type { ThemeColors } from '@/types';
import { ClipReveal } from './primitives/ClipReveal';

export function FixturesHero({ theme }: { theme: ThemeColors }) {
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
        MATCH
      </div>

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

        <span
          className="hidden rounded-full md:inline-block"
          style={{
            width: 10,
            height: 10,
            background: theme.accent,
            animation: 'dot-pop 0.5s var(--ease-spring) 0.7s both',
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

      <div
        className="relative mt-2 font-heading text-[11px] font-semibold uppercase tracking-[6px] md:mt-3 md:text-sm md:tracking-[8px]"
        style={{ color: `${theme.accent}35`, animation: 'hero-fade-in 0.8s ease 1s both' }}
        data-parallax-layer="front">
        COUNTS
      </div>
    </div>
  );
}
