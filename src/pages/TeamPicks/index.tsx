import React from 'react';

import { PlayerCard } from '../../components/PlayerCard';
import { players } from './data';
import { Container, PlayersGrid, Title } from './styles';

export const TeamPicksPage: React.FC = () => {
  return (
    <Container>
      <Title>Team Picks</Title>
      <PlayersGrid>
        {players.map((player) => (
          <PlayerCard key={player.name} player={player} />
        ))}
      </PlayersGrid>
    </Container>
  );
};
