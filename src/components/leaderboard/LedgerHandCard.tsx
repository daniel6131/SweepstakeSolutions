import { ShareHandButton } from '@/components/share/ShareHandButton';
import { Flag } from '@/components/ui/Flag';
import { POT_LABEL, fmtSigned, ordinalSuffix } from '@/lib/ledger-format';
import type { LedgerEntry, LedgerTeam, PotVerdict } from '@/lib/ledger-of-fate';
import type { ThemeColors } from '@/types';

type Props = {
  entry: LedgerEntry;
  rank: number;
  theme: ThemeColors;
};

const VERDICT_META: Record<PotVerdict, { label: string; color: string; hint: string }> = {
  GIFTED: {
    label: 'GIFTED',
    color: 'var(--color-success)',
    hint: 'one of the best in its pot, the draw blessed you',
  },
  ROBBED: {
    label: 'ROBBED',
    color: 'var(--color-danger)',
    hint: 'one of the worst in its pot, fate robbed you',
  },
  PAR: { label: 'PAR', color: 'var(--color-fg-muted)', hint: 'a middling draw for its pot' },
};

/** Custom, on-theme hover tooltip (no default system chrome). Hidden on touch. */
function Tooltip({ text, align = 'center' }: { text: string; align?: 'center' | 'right' }) {
  const pos = align === 'right' ? 'right-0' : 'left-1/2 -translate-x-1/2';
  return (
    <span
      role="tooltip"
      className={`pointer-events-none absolute bottom-full ${pos} z-30 mb-2 w-max max-w-60 rounded-lg px-3 py-2 text-[11px] leading-snug font-medium opacity-0 transition-opacity duration-150 group-hover:opacity-100`}
      style={{
        background: 'var(--card-surface)',
        border: '1px solid var(--card-border)',
        borderTop: '2px solid var(--color-accent)',
        color: 'var(--color-fg)',
        boxShadow: 'var(--shadow-card-lg)',
      }}>
      {text}
    </span>
  );
}

/** Shared verdict badge: filled and loud for the extremes, outlined for a middling draw. */
export function VerdictChip({ verdict }: { verdict: PotVerdict }) {
  const { label, color } = VERDICT_META[verdict];
  const base =
    'font-heading inline-block rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-[1px]';
  if (verdict === 'PAR') {
    return (
      <span className={base} style={{ color, border: `1px solid ${color}` }}>
        {label}
      </span>
    );
  }
  return (
    <span className={base} style={{ background: color, color: 'var(--color-bg)' }}>
      {label}
    </span>
  );
}

/** One owned team, graded against the 11 others drawn from the same pot. */
function HandTile({ team }: { team: LedgerTeam }) {
  const meta = VERDICT_META[team.verdict];
  const accent = meta.color;
  const isExtreme = team.verdict !== 'PAR';
  const suffix = ordinalSuffix(team.potRank);
  const tip = `${team.team}: ${team.potRank}${suffix} of ${team.potSize} ${POT_LABEL[team.pot]}s (${team.pts} pts). ${meta.hint}.`;

  const tileStyle = isExtreme
    ? {
        background: `color-mix(in oklab, ${accent} 9%, transparent)`,
        border: `1px solid color-mix(in oklab, ${accent} 28%, transparent)`,
        borderLeft: `3px solid ${accent}`,
      }
    : { background: 'var(--color-accent-a4)', border: '1px solid var(--card-border)' };

  return (
    <div className="group relative flex flex-col gap-3.5 rounded-xl p-4" style={tileStyle}>
      <div className="flex items-center gap-2.5">
        <Flag team={team.team} size={28} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-bold leading-tight">{team.team}</div>
          <div
            className="font-heading text-[10px] font-semibold uppercase tracking-[1.5px]"
            style={{ color: 'var(--color-fg-subtle)' }}>
            {POT_LABEL[team.pot]} · {team.pts} pts
          </div>
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div className="flex items-baseline gap-1">
          <span className="font-display text-3xl leading-none" style={{ color: accent }}>
            {team.potRank}
          </span>
          <span className="font-display text-base leading-none" style={{ color: accent }}>
            {suffix}
          </span>
          <span
            className="ml-1 text-[11px] font-medium"
            style={{ color: 'var(--color-fg-subtle)' }}>
            of {team.potSize}
          </span>
        </div>
        <VerdictChip verdict={team.verdict} />
      </div>

      <Tooltip text={tip} />
    </div>
  );
}

/** A player's full hand: identity, four graded draws, and their score vs an average hand. */
export function LedgerHandCard({ entry, rank, theme }: Props) {
  const overPar = entry.fateDelta >= 0;
  const parTip = `${entry.name} is ${fmtSigned(entry.fateDelta)} points vs what an average hand from these four pots would score.`;

  return (
    <li className="surface-card rounded-2xl px-4 py-5 md:px-6 md:py-6" data-ledger-reveal>
      <div className="flex items-center gap-3 md:gap-4">
        <span
          className="font-display w-6 shrink-0 text-center text-2xl leading-none md:w-8 md:text-3xl"
          style={{ color: rank <= 3 ? theme.accent : 'var(--color-fg-subtle)' }}>
          {rank}
        </span>
        <span className="min-w-0 flex-1 truncate text-[15px] font-bold md:text-base">
          {entry.name}
        </span>
        <div className="group relative flex shrink-0 flex-col items-end">
          <span
            className="font-display text-2xl leading-none tabular-nums md:text-3xl"
            style={{ color: overPar ? 'var(--color-success)' : 'var(--color-danger)' }}>
            {fmtSigned(entry.fateDelta)}
          </span>
          <span
            className="font-heading text-[9px] font-semibold uppercase tracking-[1.5px]"
            style={{ color: 'var(--color-fg-subtle)' }}>
            vs par
          </span>
          <Tooltip text={parTip} align="right" />
        </div>
        <ShareHandButton name={entry.name} theme={theme} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-4">
        {entry.teams.map((team) => (
          <HandTile key={team.team} team={team} />
        ))}
      </div>
    </li>
  );
}
