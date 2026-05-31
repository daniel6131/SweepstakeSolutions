import type { ThemeColors } from '@/types';
import { ClipReveal } from './primitives/ClipReveal';

export function FixturesHero({ theme }: { theme: ThemeColors }) {
  const wordStyle = {
    fontSize: 'clamp(56px, 15vw, 150px)',
    color: 'var(--color-fg)',
    letterSpacing: '-0.03em',
    lineHeight: '0.85',
    textShadow: `0 0 64px ${theme.accent}33`,
  };

  return (
    <div className="relative flex flex-col items-center">
      <div
        className="relative flex flex-col items-center gap-1 md:flex-row md:gap-5"
        data-parallax-layer="mid">
        <ClipReveal delay={0.3} className="font-display" style={wordStyle}>
          EVERY
        </ClipReveal>

        <span
          className="hidden rounded-full md:inline-block"
          style={{
            width: 12,
            height: 12,
            background: theme.accent,
            boxShadow: `0 0 24px ${theme.accent}`,
            animation: 'dot-pop 0.5s var(--ease-spring) 0.7s both',
          }}
        />

        <ClipReveal delay={0.5} className="font-display" style={wordStyle}>
          GOAL
        </ClipReveal>
      </div>

      <div
        className="mt-3 flex items-center gap-3 self-start md:mt-4"
        data-parallax-layer="front"
        style={{ animation: 'hero-fade-in 0.8s ease 1s both' }}>
        <span
          className="block h-0.75 w-10 md:w-16"
          style={{
            background: theme.accent,
            animation: 'line-draw 0.9s var(--ease-emphasized) 1s both',
            transformOrigin: 'left',
          }}
        />
        <span
          className="font-heading text-[10px] font-semibold uppercase md:text-xs"
          style={{ color: 'var(--color-fg-muted)', letterSpacing: '0.32em' }}>
          104 Matches · 16 Cities
        </span>
      </div>
    </div>
  );
}
