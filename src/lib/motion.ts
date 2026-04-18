/**
 * Typed motion tokens — single source of truth for easing and duration values.
 *
 * CSS counterparts live in globals.css as --ease-* and --duration-* tokens.
 * Use EASE for GSAP `ease` props; use CSS_EASE for inline `style` animation strings.
 */

export const EASE = {
  /** Standard page-level transitions — smooth deceleration. For GSAP: power3.inOut, etc. */
  standard: 'cubic-bezier(0.32, 0.72, 0, 1)',
  /** Expressive exits and entrances — expo-style overshoot fade. For GSAP: expo.out */
  emphasized: 'cubic-bezier(0.19, 1, 0.22, 1)',
  /** Spring pop — for badge, dot, and orb entries. Controlled overshoot. */
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  /** Flag pop — softer spring for large elements. */
  flagPop: 'cubic-bezier(0.22, 1.12, 0.36, 1)',
  /** Confetti scatter — quick ease-out deceleration. */
  scatter: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
  /** Material standard — for UI state transitions (orb, overlays). */
  material: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

/** CSS var references — use in inline `style` objects for `animation` shorthand. */
export const CSS_EASE = {
  emphasized: 'var(--ease-emphasized)',
  standard: 'var(--ease-standard)',
} as const;

export const DURATION = {
  fast: 180,
  base: 320,
  slow: 640,
  slower: 800,
  slowest: 1200,
} as const;

/** GSAP-compatible ease strings */
export const GSAP_EASE = {
  standard: 'power3.inOut',
  emphasizedOut: 'expo.out',
  emphasizedInOut: 'power4.inOut',
  wipe: 'power3.inOut',
  dissolve: 'power2.out',
} as const;
