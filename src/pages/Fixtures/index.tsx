import type React from 'react';
import { useEffect, useState } from 'react';

import { FixtureCard } from '../../components/FixtureCard';
import { fetchWorldCupFixtures } from '../../services/apiFootball';
import type { Fixture } from '../../types/shared';
import { Container, FixturesGrid, Section, SectionTitle, Title } from './styles';

export const FixturesPage: React.FC = () => {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFixtures = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchWorldCupFixtures(true);

        const transformed: Fixture[] = data.map((apiFixture: any) => {
          const date = new Date(apiFixture.fixture.date);
          const formattedDate = date.toLocaleString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit',
          });

          const homeGoals = apiFixture.goals.home ?? 0;
          const awayGoals = apiFixture.goals.away ?? 0;
          const homePenalties = apiFixture.score.penalty?.home;
          const awayPenalties = apiFixture.score.penalty?.away;

          // Determine winner
          let winner: 'home' | 'away' | 'draw' | undefined;
          if (homePenalties !== null && awayPenalties !== null) {
            winner = homePenalties > awayPenalties ? 'home' : 'away';
          } else if (homeGoals > awayGoals) {
            winner = 'home';
          } else if (awayGoals > homeGoals) {
            winner = 'away';
          } else {
            winner = 'draw';
          }

          return {
            round: apiFixture.league.round || 'Group Stage',
            date: formattedDate,
            home: apiFixture.teams.home.name,
            away: apiFixture.teams.away.name,
            score: `${homeGoals} - ${awayGoals}`,
            penalty:
              homePenalties !== null && awayPenalties !== null
                ? `${homePenalties} - ${awayPenalties}`
                : undefined,
            venue: apiFixture.fixture.venue.name,
            winner,
          };
        });

        setFixtures(transformed);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load fixtures');
        console.error('Error loading fixtures:', err);
      } finally {
        setLoading(false);
      }
    };

    loadFixtures();
  }, []);

  if (loading) {
    return (
      <Container>
        <Title>Fixtures & Results</Title>
        <p>Loading fixtures...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Title>Fixtures & Results</Title>
        <p>Error: {error}</p>
      </Container>
    );
  }

  const fixturesByRound = fixtures.reduce(
    (acc, fixture) => {
      if (!acc[fixture.round]) {
        acc[fixture.round] = [];
      }
      acc[fixture.round].push(fixture);
      return acc;
    },
    {} as Record<string, typeof fixtures>
  );

  return (
    <Container>
      <Title>Fixtures & Results</Title>
      {Object.entries(fixturesByRound).map(([round, roundFixtures]) => (
        <Section key={round}>
          <SectionTitle>{round}</SectionTitle>
          <FixturesGrid>
            {roundFixtures.map((fixture, index) => (
              <FixtureCard key={index} fixture={fixture} />
            ))}
          </FixturesGrid>
        </Section>
      ))}
    </Container>
  );
};
