import type { ThemeColors } from '@/types';
import { SplitChars } from './primitives/SplitChars';

export function GroupsHero({ theme }: { theme: ThemeColors }) {
  const groups = 'ABCDEFGHIJKL'.split('');

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
        DRAW
      </div>

      <div className="relative mb-5 overflow-hidden py-1 md:mb-7" data-parallax-layer="mid">
        <SplitChars
          text="GROUPS"
          className="font-display tracking-[-0.03em]"
          stagger={0.06}
          delay={0.3}
          duration="1s"
          charStyle={{
            fontSize: 'clamp(60px, 17vw, 160px)',
            lineHeight: '0.85',
            WebkitTextStroke: `2px ${theme.accent}`,
            WebkitTextFillColor: 'transparent',
            color: 'transparent',
          }}
        />
      </div>

      <div
        className="relative flex flex-wrap items-center justify-center gap-2 md:gap-3"
        data-parallax-layer="front">
        {groups.map((g, i) => (
          <div
            key={g}
            className="font-display flex items-center justify-center rounded-lg text-base md:rounded-xl md:text-lg"
            style={{
              width: 'clamp(36px, 6vw, 50px)',
              height: 'clamp(36px, 6vw, 50px)',
              background: `${theme.accent}08`,
              border: `1.5px solid ${theme.accent}18`,
              color: theme.accent,
              animation: `badge-pop 0.65s var(--ease-spring) ${0.6 + i * 0.04}s both, badge-glow 2.5s ease-in-out ${1.6 + i * 0.12}s 1`,
            }}>
            {g}
          </div>
        ))}
      </div>
    </div>
  );
}
