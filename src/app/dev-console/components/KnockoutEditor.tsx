import type { KnockoutResult } from '@/lib/knockout';
import type { ProjectedKnockoutBracket } from '@/lib/knockout';

const DEV_THEME = {
  bg: '#08111b',
  accent: '#7ef2cf',
  card: '#0f1b28',
};

type Props = {
  bracket: ProjectedKnockoutBracket;
  knockoutResults: Partial<Record<number, KnockoutResult>>;
  ownerByTeam: Map<string, string>;
  onUpdateScore: (matchNumber: number, field: 'homeScore' | 'awayScore', value: string) => void;
  onSetWinner: (matchNumber: number, winner: 'home' | 'away') => void;
  onClearMatch: (matchNumber: number) => void;
};

export function KnockoutEditor({
  bracket,
  knockoutResults,
  ownerByTeam,
  onUpdateScore,
  onSetWinner,
  onClearMatch,
}: Props) {
  return (
    <section
      className="rounded-[28px] p-4 md:p-5"
      style={{
        background: `linear-gradient(180deg, ${DEV_THEME.card}f2 0%, ${DEV_THEME.card}dc 100%)`,
        border: `1px solid ${DEV_THEME.accent}14`,
      }}>
      <div className="mb-4">
        <div
          className="font-heading text-[10px] font-bold uppercase tracking-[3px]"
          style={{ color: `${DEV_THEME.accent}58` }}>
          Knockout Editor
        </div>
        <div
          className="font-display mt-1 text-[28px] leading-none tracking-[-0.04em]"
          style={{ color: DEV_THEME.accent }}>
          Resolve bracket results
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {bracket.rounds.map((round) => (
          <div
            key={round.key}
            className="rounded-[24px] p-4"
            style={{
              background: `${DEV_THEME.accent}05`,
              border: `1px solid ${DEV_THEME.accent}14`,
            }}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div
                  className="font-heading text-[9px] font-bold uppercase tracking-[2px]"
                  style={{ color: `${DEV_THEME.accent}46` }}>
                  {round.shortTitle}
                </div>
                <div className="font-display text-[20px]" style={{ color: DEV_THEME.accent }}>
                  {round.title}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {round.matches.map((match) => {
                const result = knockoutResults[match.match];
                const needsWinner =
                  match.isReady &&
                  result?.homeScore !== null &&
                  result?.awayScore !== null &&
                  result?.homeScore === result?.awayScore;

                return (
                  <div
                    key={match.match}
                    className="rounded-[20px] p-3"
                    style={{
                      background: `${DEV_THEME.bg}b8`,
                      border: `1px solid ${
                        match.isPlayed ? `${DEV_THEME.accent}22` : `${DEV_THEME.accent}14`
                      }`,
                    }}>
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div
                        className="font-heading rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[2px]"
                        style={{ background: DEV_THEME.accent, color: DEV_THEME.bg }}>
                        Match {match.match}
                      </div>
                      <div
                        className="font-heading text-[9px] font-bold uppercase tracking-[2px]"
                        style={{ color: `${DEV_THEME.accent}48` }}>
                        {match.date}
                      </div>
                    </div>

                    {(['home', 'away'] as const).map((side) => {
                      const slot = match[side];
                      const field = side === 'home' ? 'homeScore' : 'awayScore';
                      const inputId = `knockout-match-${match.match}-${side}`;

                      return (
                        <div key={side} className="mb-2 flex items-center justify-between gap-3">
                          <label htmlFor={inputId} className="min-w-0 cursor-default">
                            <div className="font-display truncate text-[16px]">{slot.label}</div>
                            <div
                              className="text-[10px] font-medium"
                              style={{ color: `${DEV_THEME.accent}4d` }}>
                              {slot.team ? (ownerByTeam.get(slot.team) ?? '—') : slot.seedLabel}
                            </div>
                          </label>
                          <input
                            id={inputId}
                            type="number"
                            min="0"
                            inputMode="numeric"
                            disabled={!match.isReady}
                            aria-label={`${slot.label} score`}
                            aria-invalid={needsWinner ? true : undefined}
                            value={result?.[field] ?? ''}
                            onChange={(e) => onUpdateScore(match.match, field, e.target.value)}
                            className="w-18 rounded-2xl border px-3 py-2 text-center text-sm font-bold outline-none disabled:cursor-not-allowed disabled:opacity-40"
                            style={{
                              background: `${DEV_THEME.bg}d9`,
                              borderColor: `${DEV_THEME.accent}1c`,
                              color: DEV_THEME.accent,
                            }}
                          />
                        </div>
                      );
                    })}

                    {needsWinner ? (
                      <div
                        className="mt-3 flex flex-wrap gap-2"
                        role="group"
                        aria-label="Pick winner">
                        {(['home', 'away'] as const).map((side) => (
                          <button
                            key={side}
                            type="button"
                            onClick={() => onSetWinner(match.match, side)}
                            aria-pressed={result?.winner === side}
                            className="font-heading cursor-pointer rounded-full px-3 py-2 text-[10px] font-bold uppercase tracking-[2px]"
                            style={{
                              background:
                                result?.winner === side
                                  ? DEV_THEME.accent
                                  : `${DEV_THEME.accent}08`,
                              color: result?.winner === side ? DEV_THEME.bg : DEV_THEME.accent,
                              border: `1px solid ${DEV_THEME.accent}18`,
                            }}>
                            Winner: {match[side].label}
                          </button>
                        ))}
                      </div>
                    ) : null}

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div
                        className="font-heading text-[8px] font-bold uppercase tracking-[2px]"
                        style={{ color: `${DEV_THEME.accent}40` }}>
                        {match.venue}
                      </div>
                      <button
                        type="button"
                        onClick={() => onClearMatch(match.match)}
                        className="font-heading cursor-pointer rounded-full px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[2px]"
                        style={{
                          background: `${DEV_THEME.accent}06`,
                          color: `${DEV_THEME.accent}78`,
                          border: `1px solid ${DEV_THEME.accent}12`,
                        }}>
                        Clear
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
