import styled from 'styled-components';

import { theme } from '../../styles/theme';
import { displayText, typography } from '../../styles/typography';

export const Container = styled.div`
  padding: ${theme.spacing.xxl} ${theme.spacing.md};
  max-width: 1400px;
  margin: 0 auto;
`;

export const Title = styled.h1`
  ${displayText}
  font-size: ${typography.fontSizes.xxxl};
  text-align: center;
  color: ${theme.colors.primary};
  margin-bottom: ${theme.spacing.xxl};

  @media (max-width: ${theme.breakpoints.tablet}) {
    font-size: ${typography.fontSizes.xl};
  }
`;

export const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${theme.spacing.lg};
  margin-top: ${theme.spacing.xxl};

  @media (max-width: ${theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`;
