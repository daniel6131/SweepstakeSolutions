import styled from 'styled-components';

import { theme } from '../../styles/theme';
import { displayText, headingText, typography } from '../../styles/typography';

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

export const Section = styled.div`
  margin-bottom: ${theme.spacing.xxl};
`;

export const SectionTitle = styled.h2`
  ${headingText}
  font-size: ${typography.fontSizes.xl};
  color: ${theme.colors.dark};
  margin-bottom: ${theme.spacing.lg};
  padding-bottom: ${theme.spacing.sm};
  border-bottom: 3px solid ${theme.colors.secondary};
`;

export const FixturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: ${theme.spacing.md};

  @media (max-width: ${theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`;
