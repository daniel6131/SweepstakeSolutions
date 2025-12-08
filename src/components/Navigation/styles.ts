import { Link } from 'react-router-dom';
import styled from 'styled-components';

import { theme } from '../../styles/theme';
import { typography } from '../../styles/typography';

export const Nav = styled.nav`
  background: ${theme.colors.dark};
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

export const NavList = styled.ul`
  display: flex;
  justify-content: center;
  list-style: none;
  flex-wrap: wrap;
  margin: 0;
  padding: 0;
`;

export const NavItem = styled.li`
  flex: 1;
  min-width: 120px;
`;

export const NavLink = styled(Link)<{ $isActive: boolean }>`
  display: block;
  width: 100%;
  padding: 18px 25px;
  background: ${(props) => (props.$isActive ? 'rgba(255,255,255,0.1)' : 'transparent')};
  color: ${theme.colors.white};
  font-family: ${typography.fonts.heading};
  font-size: ${typography.fontSizes.base};
  letter-spacing: ${typography.letterSpacing.normal};
  text-transform: uppercase;
  text-align: center;
  transition: all ${theme.transitions.normal};
  position: relative;
  text-decoration: none;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    width: ${(props) => (props.$isActive ? '80%' : '0')};
    height: 3px;
    background: ${theme.colors.secondary};
    transition: all ${theme.transitions.normal};
    transform: translateX(-50%);
  }

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  &:hover::after {
    width: 80%;
  }

  @media (max-width: ${theme.breakpoints.tablet}) {
    padding: 15px 10px;
    font-size: ${typography.fontSizes.sm};
  }
`;
