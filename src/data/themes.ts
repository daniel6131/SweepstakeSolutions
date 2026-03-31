import type { TabKey, ThemeColors } from '@/types';

/**
 * Each tab is a distinct color "world" — not just an accent swap,
 * but a completely different atmosphere (Champions4Good pattern).
 */
export const THEMES: Record<TabKey, ThemeColors> = {
  Leaderboard: {
    bg: '#002629',      // deep dark green
    accent: '#94FFE4',  // mint green
    accent2: '#06D6A0',
    card: '#00363b',
  },
  Fixtures: {
    bg: '#291900',      // deep brown
    accent: '#FFAC47',  // warm amber
    accent2: '#FF8C00',
    card: '#3d2600',
  },
  Groups: {
    bg: '#23002b',      // deep purple
    accent: '#E894FF',  // light purple
    accent2: '#9B59FF',
    card: '#320040',
  },
  Teams: {
    bg: '#0a1628',      // deep navy
    accent: '#5BC0EB',  // sky blue
    accent2: '#0096D6',
    card: '#0f2040',
  },
};
