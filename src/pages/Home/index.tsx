import type React from 'react';

import { StatCard } from '../../components/StatCard';
import { homeStats } from './data';
import { Container, StatsGrid, Title } from './styles';

export const HomePage: React.FC = () => {
  return (
    <Container>
      <Title>Welcome to the World Cup 2026 Sweepstake!</Title>
      <StatsGrid>
        <StatCard number={homeStats.totalPlayers} label="Players" delay={0} />
        <StatCard number={homeStats.totalTeams} label="Teams" delay={0.1} />
        <StatCard number={homeStats.totalGroups} label="Groups" delay={0.2} />
        <StatCard number={homeStats.totalFixtures} label="Fixtures" delay={0.3} />
      </StatsGrid>
    </Container>
  );
};
