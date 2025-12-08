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
`;

export const PlayersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: ${theme.spacing.lg};

  @media (max-width: ${theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`;
