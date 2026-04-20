import { render, screen } from '@testing-library/react';

import { FixtureCard } from './FixtureCard';

vi.mock('next/image', () => ({
  default: ({ alt }: { alt?: string }) => <span aria-label={alt} data-testid="mock-next-image" />,
}));

describe('FixtureCard', () => {
  it('renders owners from the current participant map', () => {
    render(
      <FixtureCard
        fixture={{
          group: 'C',
          t1: 'Brazil',
          t2: 'Morocco',
          date: 'Jun 11',
          time: '20:00',
          venue: 'AT&T Stadium',
          s1: null,
          s2: null,
        }}
        ownerByTeam={
          new Map([
            ['Brazil', 'Zoe'],
            ['Morocco', 'Liam'],
          ])
        }
        theme={{
          bg: '#101010',
          accent: '#f97316',
          accent2: '#22c55e',
          card: '#18181b',
        }}
        timeZone="Australia/Melbourne"
      />
    );

    expect(screen.getByText('Zoe')).toBeInTheDocument();
    expect(screen.getByText('Liam')).toBeInTheDocument();
    expect(screen.queryByText('Adam')).not.toBeInTheDocument();
  });
});
