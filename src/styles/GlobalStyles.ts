import { createGlobalStyle } from 'styled-components';
import { theme } from './theme';
import { typography } from './typography';

export const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: ${typography.fonts.body};
    background: ${theme.colors.backgroundGradient};
    color: ${theme.colors.text};
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  h1, h2, h3, h4, h5, h6 {
    margin: 0;
    font-weight: ${typography.fontWeights.bold};
  }

  button {
    font-family: inherit;
    cursor: pointer;
    border: none;
    outline: none;

    &:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
  }

  a {
    text-decoration: none;
    color: inherit;
  }

  input, textarea, select {
    font-family: inherit;
    outline: none;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideIn {
    from {
      transform: translateX(-100%);
    }
    to {
      transform: translateX(0);
    }
  }

  @keyframes scaleIn {
    from {
      transform: scale(0.95);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }
`;
