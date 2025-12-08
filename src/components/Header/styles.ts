import styled from 'styled-components';

import { theme } from '../../styles/theme';
import { displayText, typography } from '../../styles/typography';

export const HeaderContainer = styled.header`
  background: ${theme.colors.primary};
  color: ${theme.colors.white};
  padding: 30px 20px;
  text-align: center;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: repeating-linear-gradient(
      45deg,
      transparent,
      transparent 10px,
      rgba(255, 255, 255, 0.03) 10px,
      rgba(255, 255, 255, 0.03) 20px
    );
    pointer-events: none;
  }
`;

export const Title = styled.h1`
  ${displayText}
  font-size: ${typography.fontSizes.display};
  margin-bottom: 10px;
  position: relative;
  text-shadow: 3px 3px 0 rgba(0, 0, 0, 0.2);

  @media (max-width: ${theme.breakpoints.tablet}) {
    font-size: ${typography.fontSizes.xxxl};
  }
`;

export const Subtitle = styled.div`
  font-family: ${typography.fonts.heading};
  font-size: ${typography.fontSizes.lg};
  letter-spacing: ${typography.letterSpacing.wide};
  color: ${theme.colors.secondary};
  position: relative;
`;
