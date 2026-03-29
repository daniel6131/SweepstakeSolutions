import type React from 'react';

import type { Fixture } from '../../types/shared';
import { AwayTeam, Card, Date, HomeTeam, Score, Teams, Venue } from './styles';

interface FixtureCardProps {
  fixture: Fixture;
}

export const FixtureCard: React.FC<FixtureCardProps> = ({ fixture }) => {
  return (
    <Card>
      <Date>{fixture.date}</Date>
      <Teams>
        <HomeTeam $isWinner={fixture.winner === 'home'}>{fixture.home}</HomeTeam>
        <Score>
          {fixture.score}
          {fixture.penalty && <span> ({fixture.penalty}p)</span>}
        </Score>
        <AwayTeam $isWinner={fixture.winner === 'away'}>{fixture.away}</AwayTeam>
      </Teams>
      <Venue>{fixture.venue}</Venue>
    </Card>
  );
};
