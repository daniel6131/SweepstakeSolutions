import type { ThemeColors } from '@/types';

/**
 * Floating sticker shapes — Champions4Good's decorative language.
 * Colored circles scattered across the viewport that animate gently.
 */
export function Stickers({ theme }: { theme: ThemeColors }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Large accent circle */}
      <div
        className="animate-float absolute rounded-full"
        style={{
          top: '-8%',
          right: '-6%',
          width: 340,
          height: 340,
          background: theme.accent,
          opacity: 0.04,
        }}
      />

      {/* Medium accent2 circle */}
      <div
        className="animate-float absolute rounded-full"
        style={{
          bottom: '-5%',
          left: '-4%',
          width: 260,
          height: 260,
          background: theme.accent2,
          opacity: 0.05,
          animationDelay: '2s',
        }}
      />

      {/* Small solid sticker — top left */}
      <div
        className="animate-float absolute rounded-full"
        style={{
          top: '12%',
          left: '5%',
          width: 48,
          height: 48,
          background: theme.accent,
          opacity: 0.12,
          animationDelay: '1s',
        }}
      />

      {/* Small ring sticker — bottom right */}
      <div
        className="animate-float absolute rounded-full"
        style={{
          bottom: '15%',
          right: '6%',
          width: 36,
          height: 36,
          border: `2px solid ${theme.accent}`,
          opacity: 0.15,
          animationDelay: '3s',
        }}
      />

      {/* Tiny dot */}
      <div
        className="animate-float absolute rounded-full"
        style={{
          top: '45%',
          left: '3%',
          width: 20,
          height: 20,
          background: theme.accent2,
          opacity: 0.1,
          animationDelay: '4s',
        }}
      />

      {/* Accent ring — right side */}
      <div
        className="animate-float absolute rounded-full"
        style={{
          top: '30%',
          right: '4%',
          width: 64,
          height: 64,
          border: `2px solid ${theme.accent2}`,
          opacity: 0.08,
          animationDelay: '5s',
        }}
      />
    </div>
  );
}
