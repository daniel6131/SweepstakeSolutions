import type React from 'react';

import {
  Card,
  Header,
  PlayerName,
  TeamFlag,
  TeamGroup,
  TeamItem,
  TeamName,
  TeamsContainer,
} from './styles';
import type { PlayerCardProps } from './types';

export const PlayerCard: React.FC<PlayerCardProps> = ({ player }) => {
  return (
    <Card>
      <Header>
        <PlayerName>{player.name}</PlayerName>
      </Header>
      <TeamsContainer>
        {player.teams.map((team, index) => (
          <TeamItem key={index}>
            <TeamFlag>{team.flag}</TeamFlag>
            <TeamName>{team.name}</TeamName>
            <TeamGroup>Group {team.group}</TeamGroup>
          </TeamItem>
        ))}
      </TeamsContainer>
    </Card>
  );
};
