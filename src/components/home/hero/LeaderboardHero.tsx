import type { ThemeColors } from '@/types';
import { SplitChars } from './primitives/SplitChars';

export function LeaderboardHero({ theme }: { theme: ThemeColors }) {
  return (
    <div className="relative flex flex-col items-center">
      {/* Headline — solid foreground statement with an accent halo.
          Filled (not thin-outline) and near-white, so it reads against the
          themed ground instead of disappearing into accent-on-accent. */}
      <div className="relative py-2 md:py-3" data-parallax-layer="mid">
        <SplitChars
          text="GLORY"
          className="font-display tracking-[-0.05em]"
          stagger={0.07}
          delay={0.3}
          duration="1.05s"
          charStyle={{
            fontSize: 'clamp(96px, 26vw, 260px)',
            lineHeight: '0.82',
            color: 'var(--color-fg)',
            textShadow: `0 0 64px ${theme.accent}33`,
          }}
        />
      </div>

      {/* Asymmetric base rule — a solid accent bar pinned left (not the generic
          fade-to-transparent-both-ends line) with a specific, non-filler label. */}
      <div
        className="mt-2 flex items-center gap-3 self-start md:mt-3"
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
          12 Players · 48 Nations
        </span>
      </div>
    </div>
  );
}
