import styled from 'styled-components';

import { theme } from '../../styles/theme';
import { displayText, headingText, typography } from '../../styles/typography';

export const Card = styled.div`
  background: ${theme.colors.white};
  border-radius: ${theme.borderRadius.lg};
  overflow: hidden;
  box-shadow: ${theme.shadows.large};
  transition: transform ${theme.transitions.normal};

  &:hover {
    transform: translateY(-5px);
  }
`;

export const Header = styled.div`
  background: ${theme.colors.primary};
  color: ${theme.colors.white};
  padding: 25px;
  text-align: center;
`;

export const PlayerName = styled.h2`
  ${displayText}
  font-size: ${typography.fontSizes.xxxl};
  margin: 0;
`;

export const TeamsContainer = styled.div`
  padding: 25px;
`;

export const TeamItem = styled.div`
  display: flex;
  align-items: center;
  padding: 15px;
  margin-bottom: 10px;
  background: ${theme.colors.light};
  border-radius: ${theme.borderRadius.md};
  border-left: 4px solid ${theme.colors.primary};
  transition: all ${theme.transitions.fast};

  &:last-child {
    margin-bottom: 0;
  }

  &:hover {
    background: #e8e9ea;
    transform: translateX(5px);
  }
`;

export const TeamFlag = styled.span`
  font-size: 2rem;
  margin-right: 15px;
  width: 40px;
  text-align: center;
`;

export const TeamName = styled.span`
  ${headingText}
  font-size: ${typography.fontSizes.md};
  font-weight: ${typography.fontWeights.semibold};
`;

export const TeamGroup = styled.span`
  margin-left: auto;
  font-size: ${typography.fontSizes.sm};
  color: ${theme.colors.textLight};
  font-weight: ${typography.fontWeights.semibold};
`;
