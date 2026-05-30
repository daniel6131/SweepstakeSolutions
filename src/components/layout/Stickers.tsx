import type { ThemeColors } from '@/types';

/**
 * Cinematic atmosphere — broadcast-grade background depth.
 *
 * Replaces the old decorative floating circles with a directional "stadium light"
 * key glow, a deep counter-glow for spatial depth, a framing vignette, and film
 * grain. Themed per tab; respects reduced motion (drift disabled in globals.css).
 */
export function Stickers({ theme }: { theme: ThemeColors }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Key light — off-center floodlight from the top-right */}
      <div
        className="atmosphere-glow absolute"
        style={{
          top: '-25%',
          right: '-12%',
          width: '72vw',
          height: '72vw',
          background: `radial-gradient(circle at center, ${theme.accent}24, transparent 62%)`,
          filter: 'blur(24px)',
        }}
      />

      {/* Counter-glow — deep accent2 from the opposite corner */}
      <div
        className="atmosphere-glow absolute"
        style={{
          bottom: '-28%',
          left: '-16%',
          width: '62vw',
          height: '62vw',
          background: `radial-gradient(circle at center, ${theme.accent2}18, transparent 66%)`,
          filter: 'blur(24px)',
          animationDelay: '6s',
        }}
      />

      {/* Vignette — frames the composition and lifts foreground contrast */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(125% 95% at 50% 8%, transparent 52%, rgba(0, 0, 0, 0.55) 100%)',
        }}
      />

      {/* Film grain — filmic texture instead of flat vector */}
      <div
        className="bg-grain absolute inset-0"
        style={{ opacity: 0.05, mixBlendMode: 'overlay' }}
      />
    </div>
  );
}
