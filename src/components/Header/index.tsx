import type React from 'react';

import { headerContent } from './data';
import { HeaderContainer, Subtitle, Title } from './styles';

export const Header: React.FC = () => {
  return (
    <HeaderContainer>
      <Title>{headerContent.title}</Title>
      <Subtitle>{headerContent.subtitle}</Subtitle>
    </HeaderContainer>
  );
};
