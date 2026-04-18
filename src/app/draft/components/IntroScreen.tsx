'use client';

import { useEffect, useState } from 'react';
import { C } from '../draft-types';

export function IntroScreen({ onStart }: { onStart: () => void }) {
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div className="draft-arena">
        <div className="draft-mesh" />
        <div className="draft-aurora" />
        <div className="draft-confetti" />
      </div>

      <div
        className="font-display relative z-10"
        style={{
          fontSize: 'clamp(80px, 22vw, 210px)',
          lineHeight: 0.82,
          WebkitTextStroke: `2px ${C.accent}`,
          WebkitTextFillColor: 'transparent',
          opacity: entered ? 1 : 0,
          transform: entered ? 'translateY(0) scale(1)' : 'translateY(60px) scale(0.9)',
          transition: 'all 1.4s cubic-bezier(0.19, 1, 0.22, 1)',
          filter: `drop-shadow(0 0 80px ${C.accent}25)`,
          letterSpacing: '-0.03em',
        }}>
        THE
        <br />
        DRAFT
      </div>

      <div
        className="font-heading relative z-10 mt-6 text-[11px] font-semibold uppercase tracking-[8px] md:text-sm"
        style={{
          color: `${C.accent}55`,
          opacity: entered ? 1 : 0,
          transform: entered ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 1s cubic-bezier(0.19, 1, 0.22, 1) 0.35s',
        }}>
        48 NATIONS · 12 PLAYERS · 4 ROUNDS
      </div>

      <div
        className="relative z-10 mx-auto mt-10 md:mt-14"
        style={{
          width: 80,
          height: 80,
          opacity: entered ? 1 : 0,
          transition: 'opacity 1.2s ease 0.7s',
        }}>
        <div className="draft-orb draft-orb--pulse" style={{ width: '100%', height: '100%' }} />
      </div>

      <button
        onClick={onStart}
        className="font-heading relative z-10 mt-10 cursor-pointer rounded-full px-12 py-5 text-sm font-bold uppercase tracking-[5px] transition-all duration-500 hover:scale-105 md:mt-14"
        style={{
          background: `linear-gradient(135deg, ${C.accent}16, ${C.accent2}14)`,
          border: `2px solid ${C.accent}45`,
          color: C.accent,
          opacity: entered ? 1 : 0,
          transform: entered ? 'translateY(0)' : 'translateY(24px)',
          transition:
            'all 1s cubic-bezier(0.19, 1, 0.22, 1) 0.9s, box-shadow 0.3s ease, transform 0.3s ease',
          boxShadow: `0 0 60px ${C.accent}1a, inset 0 0 30px ${C.accent}08`,
        }}>
        BEGIN THE DRAFT
      </button>
    </div>
  );
}
