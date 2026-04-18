import type { Fixture } from '@/types';

const DEV_THEME = {
  bg: '#08111b',
  accent: '#7ef2cf',
  card: '#0f1b28',
};

type Props = {
  visibleFixtures: Fixture[];
  ownerByTeam: Map<string, string>;
  fixtureIndexById: Map<string, number>;
  onUpdateScore: (index: number, field: 's1' | 's2', value: string) => void;
};

function fixtureId(fixture: Fixture): string {
  return [fixture.group, fixture.date, fixture.time, fixture.t1, fixture.t2].join('|');
}

export function ScoreEditor({
  visibleFixtures,
  ownerByTeam,
  fixtureIndexById,
  onUpdateScore,
}: Props) {
  return (
    <div
      className="rounded-[28px] p-4 md:p-5"
      style={{
        background: `linear-gradient(180deg, ${DEV_THEME.card}f2 0%, ${DEV_THEME.card}dc 100%)`,
        border: `1px solid ${DEV_THEME.accent}14`,
      }}>
      <div className="mb-4">
        <div
          className="font-heading text-[10px] font-bold uppercase tracking-[3px]"
          style={{ color: `${DEV_THEME.accent}58` }}>
          Fixture Editor
        </div>
        <div
          className="font-display mt-1 text-[28px] leading-none tracking-[-0.04em]"
          style={{ color: DEV_THEME.accent }}>
          Override scores
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {visibleFixtures.map((fixture) => {
          const id = fixtureId(fixture);
          const idx = fixtureIndexById.get(id) ?? -1;

          return (
            <div
              key={id}
              className="rounded-[24px] p-4"
              style={{
                background: `${DEV_THEME.accent}06`,
                border: `1px solid ${DEV_THEME.accent}14`,
              }}>
              <div className="mb-3 flex items-center justify-between gap-2">
                <div
                  className="font-heading rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[2px]"
                  style={{ background: DEV_THEME.accent, color: DEV_THEME.bg }}>
                  Group {fixture.group}
                </div>
                <div
                  className="font-heading text-[9px] font-bold uppercase tracking-[2px]"
                  style={{ color: `${DEV_THEME.accent}5c` }}>
                  {fixture.date} · {fixture.time}
                </div>
              </div>

              <div className="space-y-3">
                {(
                  [
                    ['t1', 's1'],
                    ['t2', 's2'],
                  ] as const
                ).map(([teamField, scoreField]) => {
                  const inputId = `${id}-${scoreField}`;
                  return (
                    <div key={teamField} className="flex items-center justify-between gap-3">
                      <label htmlFor={inputId} className="min-w-0 cursor-default">
                        <div className="font-display truncate text-[16px]">
                          {fixture[teamField]}
                        </div>
                        <div
                          className="text-[10px] font-medium"
                          style={{ color: `${DEV_THEME.accent}4d` }}>
                          {ownerByTeam.get(fixture[teamField]) ?? '—'}
                        </div>
                      </label>
                      <input
                        id={inputId}
                        type="number"
                        min="0"
                        inputMode="numeric"
                        aria-label={`${fixture[teamField]} score`}
                        value={fixture[scoreField] ?? ''}
                        onChange={(e) => onUpdateScore(idx, scoreField, e.target.value)}
                        className="w-18 rounded-2xl border px-3 py-2 text-center text-sm font-bold outline-none"
                        style={{
                          background: `${DEV_THEME.bg}d9`,
                          borderColor: `${DEV_THEME.accent}1c`,
                          color: DEV_THEME.accent,
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              <div
                className="font-heading mt-3 truncate text-[9px] font-bold uppercase tracking-[2px]"
                style={{ color: `${DEV_THEME.accent}40` }}>
                {fixture.venue}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
