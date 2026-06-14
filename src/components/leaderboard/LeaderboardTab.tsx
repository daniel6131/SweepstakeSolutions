'use client';

import { useState } from 'react';

import { LeaderboardTable } from '@/components/leaderboard/LeaderboardTable';
import { LedgerOfFate } from '@/components/leaderboard/LedgerOfFate';
import { Podium } from '@/components/leaderboard/Podium';
import { SectionHeading } from '@/components/ui/SectionHeading';
import type { LedgerOfFate as LedgerOfFateData } from '@/lib/ledger-of-fate';
import type { LeaderboardEntry, ThemeColors } from '@/types';

type View = 'table' | 'ledger';

type Props = {
  entries: LeaderboardEntry[];
  ledger?: LedgerOfFateData;
  theme: ThemeColors;
};

const VIEWS: { key: View; label: string }[] = [
  { key: 'table', label: 'Standings' },
  { key: 'ledger', label: 'Ledger of Fate' },
];

export function LeaderboardTab({ entries, ledger, theme }: Props) {
  const [view, setView] = useState<View>('table');
  // Defensive: a stale persisted snapshot may predate the ledger field.
  const hasLedger = Boolean(ledger && ledger.entries.length > 0);
  const showLedger = hasLedger && view === 'ledger';

  return (
    <div>
      <SectionHeading overline="STANDINGS" line1="LEADERBOARD" accent={theme.accent} />

      {hasLedger && (
        <div className="mb-8 flex justify-center" data-reveal>
          <div
            className="inline-flex rounded-full p-1"
            style={{
              background: 'var(--color-accent-a8)',
              border: '1px solid var(--card-border)',
            }}>
            {VIEWS.map(({ key, label }) => {
              const active = view === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setView(key)}
                  aria-pressed={active}
                  className={`font-heading cursor-pointer rounded-full px-4 py-1.5 text-[12px] font-semibold tracking-[1.5px] uppercase transition-colors md:text-[13px] ${
                    active ? '' : 'hover:bg-(--color-accent-a12) hover:text-(--color-fg)'
                  }`}
                  style={
                    active
                      ? { background: theme.accent, color: theme.bg }
                      : { color: 'var(--color-fg-muted)' }
                  }>
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {showLedger && ledger ? (
        <LedgerOfFate ledger={ledger} theme={theme} />
      ) : (
        <>
          <Podium top3={entries.slice(0, 3)} theme={theme} />
          <LeaderboardTable entries={entries} theme={theme} />
        </>
      )}
    </div>
  );
}
