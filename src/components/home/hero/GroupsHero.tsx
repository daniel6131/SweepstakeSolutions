'use client';

import type { ThemeColors } from '@/types';
import { useEffect, useState } from 'react';
import { SplitChars } from './primitives/SplitChars';

const LETTERS = 'ABCDEFGHIJKL'.split('');

/** A single group badge that "spins" through letters, then locks to its own. */
function GroupBadge({ letter, index, accent }: { letter: string; index: number; accent: string }) {
  const [display, setDisplay] = useState(letter);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const t = setTimeout(() => setLocked(true), 0);
      return () => clearTimeout(t);
    }

    const lockAt = 650 + index * 115; // badges lock in sequence A → L
    const shuffle = setInterval(() => {
      setDisplay(LETTERS[Math.floor(Math.random() * LETTERS.length)]);
    }, 55);
    const lock = setTimeout(() => {
      clearInterval(shuffle);
      setDisplay(letter);
      setLocked(true);
    }, lockAt);

    return () => {
      clearInterval(shuffle);
      clearTimeout(lock);
    };
  }, [letter, index]);

  return (
    <div
      className="font-display flex items-center justify-center rounded-lg text-base md:rounded-xl md:text-lg"
      style={{
        width: 'clamp(34px, 5.5vw, 46px)',
        height: 'clamp(34px, 5.5vw, 46px)',
        background: 'var(--card-surface)',
        border: `1px solid ${locked ? `${accent}5a` : 'var(--card-border)'}`,
        color: locked ? accent : 'var(--color-fg-subtle)',
        boxShadow: 'var(--card-highlight)',
        transition: 'border-color 0.3s ease, color 0.2s ease',
        animation: locked ? 'badge-lock 0.34s var(--ease-emphasized) both' : undefined,
      }}>
      {display}
    </div>
  );
}

export function GroupsHero({ theme }: { theme: ThemeColors }) {
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
        className="relative mt-6 flex flex-wrap items-center justify-center gap-2 md:mt-8 md:gap-2.5"
        data-parallax-layer="front">
        {LETTERS.map((g, i) => (
          <GroupBadge key={g} letter={g} index={i} accent={theme.accent} />
        ))}
      </div>
    </div>
  );
}
