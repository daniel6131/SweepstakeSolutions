export const theme = {
  colors: {
    primary: '#1a4d2e',
    secondary: '#ffd700',
    accent: '#ff6b35',
    dark: '#0d1b2a',
    light: '#f8f9fa',
    text: '#1b263b',
    textLight: '#666',
    textMuted: '#888',
    border: '#e0e1dd',
    white: '#ffffff',

    // Background gradients
    backgroundGradient: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',

    // Rank colors
    rankGold: 'rgba(255, 215, 0, 0.15)',
    rankSilver: 'rgba(192, 192, 192, 0.15)',
    rankBronze: 'rgba(205, 127, 50, 0.15)',
  },

  breakpoints: {
    mobile: '480px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1400px',
  },

  spacing: {
    xs: '5px',
    sm: '10px',
    md: '15px',
    lg: '20px',
    xl: '30px',
    xxl: '40px',
  },

  borderRadius: {
    sm: '4px',
    md: '10px',
    lg: '15px',
  },

  shadows: {
    small: '0 5px 15px rgba(0,0,0,0.08)',
    medium: '0 8px 20px rgba(0,0,0,0.1)',
    large: '0 10px 30px rgba(0,0,0,0.1)',
    hover: '0 15px 40px rgba(0,0,0,0.15)',
  },

  transitions: {
    fast: '0.2s ease',
    normal: '0.3s ease',
    slow: '0.5s ease',
  },
} as const;

export type Theme = typeof theme;
