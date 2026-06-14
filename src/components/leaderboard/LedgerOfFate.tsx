'use client';

import gsap from 'gsap';
import { useEffect, useRef } from 'react';

import { LedgerHandCard, VerdictChip } from '@/components/leaderboard/LedgerHandCard';
import { PotLeagueTable } from '@/components/leaderboard/PotLeagueTable';
import { SectionHeading } from '@/components/ui/SectionHeading';
import type { DraftPot } from '@/data/draftPots';
import type { LedgerOfFate as LedgerOfFateData } from '@/lib/ledger-of-fate';
import { GSAP_EASE } from '@/lib/motion';
import type { ThemeColors } from '@/types';

type Props = {
  ledger: LedgerOfFateData;
  theme: ThemeColors;
};

const LEAGUES: { pot: DraftPot; label: string; tier: string }[] = [
  { pot: 1, label: 'Top Seeds', tier: 'Pot 1' },
  { pot: 2, label: 'Contenders', tier: 'Pot 2' },
  { pot: 3, label: 'Dark Horses', tier: 'Pot 3' },
  { pot: 4, label: 'Long Shots', tier: 'Pot 4' },
];

export function LedgerOfFate({ ledger, theme }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

  // Entrance runs ONCE when the view mounts, deliberately not on every live poll.
  // `ledger` gets a fresh object reference each refresh; depending on it here would
  // re-fire the fade-from-zero and flash the whole view every few seconds.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const mm = gsap.matchMedia();
    mm.add(
      {
        motion: '(prefers-reduced-motion: no-preference)',
        reduced: '(prefers-reduced-motion: reduce)',
      },
      (context) => {
        const { reduced } = context.conditions as { reduced: boolean };
        const els = root.querySelectorAll('[data-ledger-reveal]');
        if (reduced) {
          gsap.set(els, { opacity: 1, y: 0 });
          return;
        }
        const ctx = gsap.context(() => {
          gsap.set(els, { opacity: 0, y: 28 });
          gsap.to(els, {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.05,
            ease: GSAP_EASE.emphasizedOut,
            delay: 0.05,
          });
        }, root);
        return () => ctx.revert();
      }
    );

    return () => mm.revert();
  }, []);

  return (
    <div ref={rootRef}>
      <div
        className="surface-card mx-auto mb-8 max-w-220 rounded-2xl p-4 md:p-5"
        data-ledger-reveal>
        <p className="text-[13px] leading-relaxed" style={{ color: 'var(--color-fg-muted)' }}>
          <strong className="font-bold" style={{ color: theme.accent }}>
            How to read this:
          </strong>{' '}
          nobody chose their teams. Everyone was dealt one nation per seeding pot, so this ranks how
          each of your four is faring against the others in its pot.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px]">
          <span className="flex items-center gap-1.5">
            <VerdictChip verdict="GIFTED" />
            <span style={{ color: 'var(--color-fg-muted)' }}>top of pot</span>
          </span>
          <span className="flex items-center gap-1.5">
            <VerdictChip verdict="PAR" />
            <span style={{ color: 'var(--color-fg-muted)' }}>middle</span>
          </span>
          <span className="flex items-center gap-1.5">
            <VerdictChip verdict="ROBBED" />
            <span style={{ color: 'var(--color-fg-muted)' }}>bottom of pot</span>
          </span>
          <span style={{ color: 'var(--color-fg-subtle)' }}>
            ± vs par = your points vs an average hand from those pots
          </span>
        </div>
      </div>

      {ledger.divergesFromLeaderboard && (
        <p
          className="mx-auto mb-6 max-w-150 rounded-xl px-4 py-2.5 text-center text-[12px]"
          style={{ background: 'var(--color-accent-a8)', color: 'var(--color-fg-muted)' }}
          data-ledger-reveal>
          Trades unbalanced the hands, so this luck-adjusted order genuinely differs from the table.
        </p>
      )}

      <ol className="flex flex-col gap-2.5 md:gap-3">
        {ledger.entries.map((entry, index) => (
          <LedgerHandCard key={entry.name} entry={entry} rank={index + 1} theme={theme} />
        ))}
      </ol>

      <div className="mt-12 md:mt-16" data-ledger-reveal>
        <SectionHeading
          overline="Within your tier"
          line1="THE FOUR LEAGUES"
          accent={theme.accent}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2" data-ledger-reveal>
        {LEAGUES.map(({ pot, label, tier }) => (
          <PotLeagueTable
            key={pot}
            label={label}
            tier={tier}
            rows={ledger.leagues[pot] ?? []}
            theme={theme}
          />
        ))}
      </div>
    </div>
  );
}
