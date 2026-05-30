import { Flag } from '@/components/ui/Flag';
import type {
  KnockoutMatch,
  KnockoutRound,
  KnockoutSlot,
  ProjectedKnockoutBracket,
} from '@/lib/knockout';
import type { ThemeColors } from '@/types';
import { Trophy } from 'lucide-react';

type Props = {
  bracket: ProjectedKnockoutBracket;
  ownerByTeam: Map<string, string>;
  theme: ThemeColors;
};

type PositionedMatch = {
  match: KnockoutMatch;
  x: number;
  y: number;
  centerY: number;
};

const CARD_WIDTH = 220;
const CARD_HEIGHT = 152;
const COLUMN_GAP = 40;
const ROW_GAP = 28;
const PADDING = 24;
const DESKTOP_STAGE_OFFSET = 64;
const CHAMP_WIDTH = 210;
const CHAMP_HEIGHT = 132;

const GOLD = 'var(--color-medal-gold)';

function shortTeamName(team: string): string {
  return team
    .replace('Bosnia and Herzegovina', 'Bosnia & Herz.')
    .replace('Bosnia-Herzegovina', 'Bosnia & Herz.');
}

function buildDesktopLayout(rounds: KnockoutRound[]) {
  const positionedRounds: PositionedMatch[][] = [];
  let previousCenters: number[] = [];

  rounds.forEach((round, roundIndex) => {
    const x = PADDING + roundIndex * (CARD_WIDTH + COLUMN_GAP);
    const centers =
      roundIndex === 0
        ? round.matches.map(
            (_, matchIndex) => PADDING + matchIndex * (CARD_HEIGHT + ROW_GAP) + CARD_HEIGHT / 2
          )
        : round.matches.map(
            (_, matchIndex) =>
              (previousCenters[matchIndex * 2] + previousCenters[matchIndex * 2 + 1]) / 2
          );

    positionedRounds.push(
      round.matches.map((match, matchIndex) => ({
        match,
        x,
        y: centers[matchIndex] - CARD_HEIGHT / 2,
        centerY: centers[matchIndex],
      }))
    );

    previousCenters = centers;
  });

  const height =
    DESKTOP_STAGE_OFFSET +
    PADDING * 2 +
    rounds[0].matches.length * CARD_HEIGHT +
    (rounds[0].matches.length - 1) * ROW_GAP;

  return { positionedRounds, height };
}

function renderSlot(
  slot: KnockoutSlot,
  ownerByTeam: Map<string, string>,
  theme: ThemeColors,
  align: 'left' | 'right'
) {
  const isPlaceholder = slot.status === 'placeholder';
  const owner = slot.team ? (ownerByTeam.get(slot.team) ?? '—') : null;

  if (isPlaceholder) {
    return (
      <div
        className="flex min-h-7.5 items-center rounded-xl border border-dashed px-2.5 py-1.5"
        style={{ borderColor: `${theme.accent}20`, background: `${theme.accent}05` }}>
        <div className={`w-full ${align === 'right' ? 'text-right' : ''}`}>
          <div
            className="font-heading text-[9px] font-bold uppercase tracking-[2px]"
            style={{ color: `${theme.accent}42` }}>
            {slot.seedLabel}
          </div>
          <div
            className="font-heading text-[10px] font-semibold uppercase tracking-[1.4px]"
            style={{ color: `${theme.accent}72` }}>
            {slot.label}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex min-h-7.5 items-center gap-2 rounded-xl px-2.5 py-1.5 ${
        align === 'right' ? 'flex-row-reverse text-right' : ''
      }`}
      style={{
        background: slot.isWinner
          ? `${theme.accent}22`
          : slot.status === 'confirmed'
            ? `${theme.accent}12`
            : `${theme.accent}08`,
        border: `1px solid ${
          slot.isWinner
            ? `${theme.accent}55`
            : slot.status === 'confirmed'
              ? `${theme.accent}28`
              : `${theme.accent}16`
        }`,
        boxShadow: slot.isWinner ? `0 0 18px ${theme.accent}26` : undefined,
      }}>
      <Flag team={slot.label} size={18} />
      <div className={`min-w-0 flex-1 ${align === 'right' ? 'text-right' : ''}`}>
        <div className={`flex items-center gap-1.5 ${align === 'right' ? 'justify-end' : ''}`}>
          {align === 'right' ? null : (
            <span
              className="font-heading shrink-0 text-[8px] font-bold uppercase tracking-[2px]"
              style={{ color: `${theme.accent}42` }}>
              {slot.seedLabel}
            </span>
          )}
          <div
            className="font-display truncate text-[11px] leading-none md:text-[12px]"
            style={{
              color: slot.isWinner
                ? theme.accent
                : slot.status === 'confirmed'
                  ? 'var(--color-fg)'
                  : 'var(--color-fg-muted)',
            }}>
            {shortTeamName(slot.label)}
          </div>
          {align === 'right' ? (
            <span
              className="font-heading shrink-0 text-[8px] font-bold uppercase tracking-[2px]"
              style={{ color: `${theme.accent}42` }}>
              {slot.seedLabel}
            </span>
          ) : null}
        </div>
        <div className="truncate text-[9px] font-medium" style={{ color: `${theme.accent}48` }}>
          {owner}
        </div>
      </div>
      {slot.score !== null ? (
        <div
          className="font-display shrink-0 text-[20px] leading-none tabular-nums"
          style={{ color: slot.isWinner ? theme.accent : 'var(--color-fg-muted)' }}>
          {slot.score}
        </div>
      ) : null}
    </div>
  );
}

function MatchCard({
  match,
  ownerByTeam,
  theme,
}: {
  match: KnockoutMatch;
  ownerByTeam: Map<string, string>;
  theme: ThemeColors;
}) {
  const hasProjection = match.home.status === 'projected' || match.away.status === 'projected';
  const needsWinnerSelection =
    match.isReady &&
    match.homeScore !== null &&
    match.awayScore !== null &&
    match.homeScore === match.awayScore &&
    !match.winner;

  return (
    <article
      className="flex flex-col justify-between overflow-hidden rounded-[22px] p-3"
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        background: 'var(--card-surface)',
        border: match.isPlayed ? `1px solid ${theme.accent}30` : '1px solid var(--card-border)',
        boxShadow: 'var(--card-highlight), var(--shadow-card)',
      }}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="font-heading rounded-full px-2 py-1 text-[8px] font-bold uppercase tracking-[2px]"
            style={{ color: theme.bg, background: theme.accent }}>
            M{match.match}
          </span>
          {hasProjection ? (
            <span
              className="font-heading text-[8px] font-bold uppercase tracking-[2px]"
              style={{ color: `${theme.accent}56` }}>
              Projected
            </span>
          ) : match.isPlayed ? (
            <span
              className="font-heading flex items-center gap-1 text-[8px] font-bold uppercase tracking-[2px]"
              style={{ color: theme.accent }}>
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: theme.accent }}
              />
              Final
            </span>
          ) : null}
        </div>
        <span
          className="font-heading text-[8px] font-bold uppercase tracking-[2px]"
          style={{ color: `${theme.accent}48` }}>
          {match.date}
        </span>
      </div>

      <div className="space-y-2">
        {renderSlot(match.home, ownerByTeam, theme, 'left')}
        {renderSlot(match.away, ownerByTeam, theme, 'right')}
      </div>

      <div className="mt-2.5 space-y-1">
        {needsWinnerSelection ? (
          <div
            className="font-heading text-[8px] font-bold uppercase tracking-[2px]"
            style={{ color: '#ffcf8d' }}>
            Select winner in dev console
          </div>
        ) : null}
        <div
          className="font-heading truncate text-[8px] font-bold uppercase tracking-[2px]"
          style={{ color: `${theme.accent}38` }}>
          {match.venue}
        </div>
      </div>
    </article>
  );
}

function ChampionCard({
  team,
  owner,
  theme,
  width,
}: {
  team: string | null;
  owner: string | null;
  theme: ThemeColors;
  width?: number;
}) {
  return (
    <div
      className="relative flex flex-col items-center justify-center overflow-hidden rounded-[22px] p-4 text-center"
      style={{
        width,
        height: CHAMP_HEIGHT,
        background: 'var(--card-surface)',
        border: `1.5px solid color-mix(in srgb, ${GOLD} 55%, transparent)`,
        boxShadow: `var(--card-highlight), var(--shadow-card-lg), 0 18px 50px -24px color-mix(in srgb, ${GOLD} 70%, transparent)`,
      }}>
      <div
        className="pointer-events-none absolute -top-10 left-1/2 h-24 w-24 -translate-x-1/2 rounded-full blur-2xl"
        style={{ background: `color-mix(in srgb, ${GOLD} 30%, transparent)` }}
      />
      <Trophy size={22} style={{ color: GOLD }} strokeWidth={1.75} />
      <div
        className="font-heading mt-2 text-[9px] font-bold uppercase tracking-[3px]"
        style={{ color: GOLD }}>
        Champion
      </div>
      {team ? (
        <>
          <div className="mt-2 flex items-center gap-2">
            <Flag team={team} size={20} />
            <span className="font-display text-[15px]" style={{ color: 'var(--color-fg)' }}>
              {shortTeamName(team)}
            </span>
          </div>
          {owner ? (
            <div className="text-[9px] font-medium" style={{ color: `${theme.accent}55` }}>
              {owner}
            </div>
          ) : null}
        </>
      ) : (
        <div className="font-display mt-2 text-[13px]" style={{ color: 'var(--color-fg-subtle)' }}>
          To be decided
        </div>
      )}
    </div>
  );
}

export function KnockoutBracket({ bracket, ownerByTeam, theme }: Props) {
  const { positionedRounds, height } = buildDesktopLayout(bracket.rounds);
  const qualifiedThirdPlacedTeams = bracket.thirdPlaceStandings.filter((entry) => entry.qualified);

  const lastRoundIndex = positionedRounds.length - 1;
  const finalPos = positionedRounds[lastRoundIndex]?.[0];
  const finalMatch = bracket.rounds[lastRoundIndex]?.matches[0];
  const championTeam = finalMatch?.winner ?? null;
  const championOwner = championTeam ? (ownerByTeam.get(championTeam) ?? null) : null;

  const champX = PADDING + bracket.rounds.length * (CARD_WIDTH + COLUMN_GAP);
  const totalWidth = champX + CHAMP_WIDTH + PADDING;
  const champCenterY = finalPos ? finalPos.centerY + DESKTOP_STAGE_OFFSET : 0;

  return (
    <div className="space-y-6 md:space-y-8" data-reveal>
      {/* ── Road to the final hero ── */}
      <section
        className="relative overflow-hidden rounded-[30px] p-5 md:p-7"
        style={{
          background: `radial-gradient(120% 100% at 100% 0%, ${theme.accent}1f 0%, transparent 45%), var(--card-surface)`,
          border: '1px solid var(--card-border)',
          boxShadow: 'var(--card-highlight), var(--shadow-card-lg)',
        }}>
        <div
          className="bg-grain pointer-events-none absolute inset-0"
          style={{ opacity: 0.04, mixBlendMode: 'overlay' }}
        />

        <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div
              className="font-heading mb-2 text-[10px] font-bold uppercase tracking-[3px]"
              style={{ color: `${theme.accent}66` }}>
              Knockout View
            </div>
            <h3
              className="font-display text-[30px] leading-none tracking-[-0.04em] md:text-[46px]"
              style={{ color: 'var(--color-fg)' }}>
              Road to the final.
            </h3>
            <p
              className="mt-3 max-w-xl text-sm leading-6 md:text-[15px]"
              style={{ color: 'var(--color-fg-muted)' }}>
              The Round of 32 updates from the live group tables. Group winners and runners-up lock
              in as their sections finish, while third-place paths remain live projections until the
              bracket is fully set.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 md:grid-cols-1">
            <div
              className="rounded-2xl px-4 py-3"
              style={{ background: `${theme.accent}0d`, border: '1px solid var(--card-border)' }}>
              <div
                className="font-heading text-[9px] font-bold uppercase tracking-[2px]"
                style={{ color: `${theme.accent}55` }}>
                Groups complete
              </div>
              <div
                className="font-display mt-1 text-[22px] tabular-nums"
                style={{ color: theme.accent }}>
                {bracket.completedGroups}/{bracket.totalGroups}
              </div>
            </div>
            <div
              className="rounded-2xl px-4 py-3"
              style={{ background: `${theme.accent}0d`, border: '1px solid var(--card-border)' }}>
              <div
                className="font-heading text-[9px] font-bold uppercase tracking-[2px]"
                style={{ color: `${theme.accent}55` }}>
                Live third places
              </div>
              <div
                className="font-display mt-1 text-[22px] tabular-nums"
                style={{ color: theme.accent }}>
                {qualifiedThirdPlacedTeams.length}
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-6">
          <div
            className="font-heading mb-3 text-[9px] font-bold uppercase tracking-[2px]"
            style={{ color: `${theme.accent}55` }}>
            Current best third-placed teams
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-8">
            {qualifiedThirdPlacedTeams.map((entry) => (
              <div
                key={entry.group}
                className="rounded-2xl px-3 py-2.5"
                style={{ background: `${theme.accent}0a`, border: '1px solid var(--card-border)' }}>
                <div className="flex items-center gap-2">
                  <Flag team={entry.team} size={16} />
                  <div className="min-w-0">
                    <div
                      className="font-display truncate text-[11px]"
                      style={{ color: 'var(--color-fg)' }}>
                      {shortTeamName(entry.team)}
                    </div>
                    <div
                      className="font-heading text-[8px] font-bold uppercase tracking-[2px]"
                      style={{ color: `${theme.accent}48` }}>
                      Group {entry.group} · {entry.pts} pts
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Projected bracket ── */}
      <section
        className="overflow-hidden rounded-[30px] p-4 md:p-5"
        style={{
          background: 'var(--card-surface)',
          border: '1px solid var(--card-border)',
          boxShadow: 'var(--card-highlight), var(--shadow-card-lg)',
        }}
        data-reveal>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <div
              className="font-heading text-[10px] font-bold uppercase tracking-[3px]"
              style={{ color: `${theme.accent}60` }}>
              Projected Bracket
            </div>
            <div
              className="font-display mt-1 text-[26px] leading-none tracking-[-0.03em] md:text-[34px]"
              style={{ color: 'var(--color-fg)' }}>
              Round of 32 to final
            </div>
          </div>
          <div
            className="font-heading hidden text-[9px] font-bold uppercase tracking-[2px] md:block"
            style={{ color: `${theme.accent}45` }}>
            Scroll horizontally to follow the path
          </div>
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <div className="relative" style={{ width: totalWidth, height }}>
            <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
              <defs>
                <linearGradient id="bracket-line" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={`${theme.accent}30`} />
                  <stop offset="100%" stopColor={`${theme.accent}66`} />
                </linearGradient>
              </defs>
              {positionedRounds.slice(0, -1).flatMap((round, roundIndex) =>
                round.flatMap((source, matchIndex) => {
                  if (matchIndex % 2 !== 0) {
                    return [];
                  }

                  const nextRound = positionedRounds[roundIndex + 1];
                  const target = nextRound[Math.floor(matchIndex / 2)];
                  const sibling = round[matchIndex + 1];
                  const startX = source.x + CARD_WIDTH;
                  const endX = target.x;
                  const branchX = startX + (endX - startX) / 2;

                  return [
                    <line
                      key={`h1-${source.match.match}`}
                      x1={startX}
                      y1={source.centerY + DESKTOP_STAGE_OFFSET}
                      x2={branchX}
                      y2={source.centerY + DESKTOP_STAGE_OFFSET}
                      stroke="url(#bracket-line)"
                      strokeWidth="2"
                    />,
                    <line
                      key={`h2-${sibling.match.match}`}
                      x1={startX}
                      y1={sibling.centerY + DESKTOP_STAGE_OFFSET}
                      x2={branchX}
                      y2={sibling.centerY + DESKTOP_STAGE_OFFSET}
                      stroke="url(#bracket-line)"
                      strokeWidth="2"
                    />,
                    <line
                      key={`v-${source.match.match}`}
                      x1={branchX}
                      y1={source.centerY + DESKTOP_STAGE_OFFSET}
                      x2={branchX}
                      y2={sibling.centerY + DESKTOP_STAGE_OFFSET}
                      stroke={`${theme.accent}45`}
                      strokeWidth="2"
                    />,
                    <line
                      key={`h3-${target.match.match}`}
                      x1={branchX}
                      y1={target.centerY + DESKTOP_STAGE_OFFSET}
                      x2={endX}
                      y2={target.centerY + DESKTOP_STAGE_OFFSET}
                      stroke="url(#bracket-line)"
                      strokeWidth="2"
                    />,
                  ];
                })
              )}
              {/* Final → champion connector */}
              {finalPos ? (
                <line
                  x1={finalPos.x + CARD_WIDTH}
                  y1={champCenterY}
                  x2={champX}
                  y2={champCenterY}
                  stroke={`color-mix(in srgb, ${GOLD} 55%, transparent)`}
                  strokeWidth="2"
                />
              ) : null}
            </svg>

            {bracket.rounds.map((round, roundIndex) => {
              const x = PADDING + roundIndex * (CARD_WIDTH + COLUMN_GAP);

              return (
                <div key={round.key}>
                  <div className="absolute z-10" style={{ left: x, top: 0, width: CARD_WIDTH }}>
                    <div
                      className="rounded-full px-3 py-2 text-center"
                      style={{
                        background: `${theme.accent}0d`,
                        border: '1px solid var(--card-border)',
                      }}>
                      <div
                        className="font-heading text-[8px] font-bold uppercase tracking-[2px]"
                        style={{ color: `${theme.accent}48` }}>
                        {round.shortTitle}
                      </div>
                      <div className="font-display mt-1 text-sm" style={{ color: theme.accent }}>
                        {round.title}
                      </div>
                    </div>
                  </div>

                  {positionedRounds[roundIndex].map(({ match, x: matchX, y }) => (
                    <div
                      key={match.match}
                      className="absolute"
                      style={{ left: matchX, top: y + DESKTOP_STAGE_OFFSET }}>
                      <MatchCard match={match} ownerByTeam={ownerByTeam} theme={theme} />
                    </div>
                  ))}
                </div>
              );
            })}

            {/* Champion column */}
            {finalPos ? (
              <>
                <div className="absolute z-10" style={{ left: champX, top: 0, width: CHAMP_WIDTH }}>
                  <div
                    className="rounded-full px-3 py-2 text-center"
                    style={{
                      background: `color-mix(in srgb, ${GOLD} 10%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${GOLD} 35%, transparent)`,
                    }}>
                    <div
                      className="font-heading text-[8px] font-bold uppercase tracking-[2px]"
                      style={{ color: `color-mix(in srgb, ${GOLD} 70%, transparent)` }}>
                      Winner
                    </div>
                    <div className="font-display mt-1 text-sm" style={{ color: GOLD }}>
                      Champion
                    </div>
                  </div>
                </div>
                <div
                  className="absolute"
                  style={{ left: champX, top: champCenterY - CHAMP_HEIGHT / 2 }}>
                  <ChampionCard
                    team={championTeam}
                    owner={championOwner}
                    theme={theme}
                    width={CHAMP_WIDTH}
                  />
                </div>
              </>
            ) : null}
          </div>
        </div>

        {/* Mobile — horizontal round columns + champion */}
        <div className="overflow-x-auto lg:hidden">
          <div className="flex w-max snap-x gap-4 pb-2">
            {bracket.rounds.map((round) => (
              <div
                key={round.key}
                className="w-70 shrink-0 snap-start space-y-3 rounded-3xl p-3"
                style={{ background: `${theme.accent}06`, border: '1px solid var(--card-border)' }}>
                <div
                  className="rounded-2xl px-3 py-2"
                  style={{
                    background: 'var(--card-surface)',
                    border: '1px solid var(--card-border)',
                  }}>
                  <div
                    className="font-heading text-[8px] font-bold uppercase tracking-[2px]"
                    style={{ color: `${theme.accent}48` }}>
                    {round.shortTitle}
                  </div>
                  <div className="font-display mt-1 text-[20px]" style={{ color: theme.accent }}>
                    {round.title}
                  </div>
                </div>

                {round.matches.map((match) => (
                  <MatchCard
                    key={match.match}
                    match={match}
                    ownerByTeam={ownerByTeam}
                    theme={theme}
                  />
                ))}
              </div>
            ))}

            {/* Champion column (mobile) */}
            {finalMatch ? (
              <div
                className="flex w-55 shrink-0 snap-start flex-col gap-3 rounded-3xl p-3"
                style={{
                  background: `color-mix(in srgb, ${GOLD} 8%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${GOLD} 30%, transparent)`,
                }}>
                <div
                  className="rounded-2xl px-3 py-2"
                  style={{
                    background: 'var(--card-surface)',
                    border: `1px solid color-mix(in srgb, ${GOLD} 30%, transparent)`,
                  }}>
                  <div
                    className="font-heading text-[8px] font-bold uppercase tracking-[2px]"
                    style={{ color: `color-mix(in srgb, ${GOLD} 70%, transparent)` }}>
                    Winner
                  </div>
                  <div className="font-display mt-1 text-[20px]" style={{ color: GOLD }}>
                    Champion
                  </div>
                </div>
                <ChampionCard team={championTeam} owner={championOwner} theme={theme} />
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
