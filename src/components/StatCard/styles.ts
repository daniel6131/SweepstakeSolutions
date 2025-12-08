import styled from 'styled-components';

import { theme } from '../../styles/theme';
import { displayText, typography } from '../../styles/typography';

export const Card = styled.div<{ delay: number }>`
  background: ${theme.colors.white};
  padding: 40px 20px;
  border-radius: ${theme.borderRadius.lg};
  box-shadow: ${theme.shadows.large};
  transition: all ${theme.transitions.normal};
  text-align: center;
  animation: fadeIn 0.5s ease ${(props) => props.delay}s both;

  &:hover {
    transform: translateY(-10px);
    box-shadow: ${theme.shadows.hover};
  }
`;

export const Number = styled.div`
  ${displayText}
  font-size: ${typography.fontSizes.display};
  color: ${theme.colors.accent};
  line-height: 1;
`;

export const Label = styled.div`
  font-family: ${typography.fonts.heading};
  font-size: ${typography.fontSizes.md};
  color: ${theme.colors.text};
  margin-top: 10px;
  text-transform: uppercase;
  letter-spacing: ${typography.letterSpacing.normal};
`;
