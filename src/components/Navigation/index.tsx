import type React from 'react';
import { useLocation } from 'react-router-dom';

import { navItems } from './data';
import { Nav, NavItem, NavLink, NavList } from './styles';

export const Navigation: React.FC = () => {
  const location = useLocation();

  return (
    <Nav>
      <NavList>
        {navItems.map((item) => (
          <NavItem key={item.path}>
            <NavLink to={item.path} $isActive={location.pathname === item.path}>
              {item.label}
            </NavLink>
          </NavItem>
        ))}
      </NavList>
    </Nav>
  );
};
