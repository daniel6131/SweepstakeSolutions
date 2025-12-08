import { css } from 'styled-components';

export const typography = {
  fonts: {
    display: "'Bebas Neue', cursive",
    heading: "'Oswald', sans-serif",
    body: "'Inter', sans-serif",
  },

  fontSizes: {
    xs: '0.8rem',
    sm: '0.85rem',
    base: '1rem',
    md: '1.1rem',
    lg: '1.2rem',
    xl: '2rem',
    xxl: '2.5rem',
    xxxl: '3rem',
    display: '4rem',
  },

  fontWeights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeights: {
    tight: 1,
    normal: 1.5,
    relaxed: 1.8,
  },

  letterSpacing: {
    tight: '0.5px',
    normal: '1px',
    wide: '2px',
    wider: '3px',
  },
} as const;

// Typography mixins
export const displayText = css`
  font-family: ${typography.fonts.display};
  letter-spacing: ${typography.letterSpacing.wide};
  line-height: ${typography.lineHeights.tight};
`;

export const headingText = css`
  font-family: ${typography.fonts.heading};
  letter-spacing: ${typography.letterSpacing.normal};
  text-transform: uppercase;
`;

export const bodyText = css`
  font-family: ${typography.fonts.body};
  line-height: ${typography.lineHeights.normal};
`;
