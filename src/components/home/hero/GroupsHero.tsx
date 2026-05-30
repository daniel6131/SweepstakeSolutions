import type { ThemeColors } from '@/types';
import { SplitChars } from './primitives/SplitChars';

export function GroupsHero({ theme }: { theme: ThemeColors }) {
  const groups = 'ABCDEFGHIJKL'.split('');

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative py-1" data-parallax-layer="mid">
        <SplitChars
          text="GROUPS"
          className="font-display tracking-[-0.04em]"
          stagger={0.06}
          delay={0.3}
          duration="1s"
          charStyle={{
            fontSize: 'clamp(64px, 17vw, 170px)',
            lineHeight: '0.85',
            color: 'var(--color-fg)',
            textShadow: `0 0 64px ${theme.accent}33`,
          }}
        />
      </div>

      <div
        className="relative mt-5 flex flex-wrap items-center justify-center gap-2 md:mt-7 md:gap-3"
        data-parallax-layer="front">
        {groups.map((g, i) => (
          <div
            key={g}
            className="font-display flex items-center justify-center rounded-lg text-base md:rounded-xl md:text-lg"
            style={{
              width: 'clamp(36px, 6vw, 50px)',
              height: 'clamp(36px, 6vw, 50px)',
              background: `${theme.accent}0d`,
              border: `1.5px solid ${theme.accent}24`,
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
