import { Flag } from '@/components/ui/Flag';
import type {
  KnockoutMatch,
  KnockoutRound,
  KnockoutSlot,
  ProjectedKnockoutBracket,
} from '@/lib/knockout';
import type { ThemeColors } from '@/types';

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
const COLUMN_GAP = 34;
const ROW_GAP = 28;
const PADDING = 24;
const DESKTOP_STAGE_OFFSET = 64;

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

  const width = PADDING * 2 + rounds.length * CARD_WIDTH + (rounds.length - 1) * COLUMN_GAP;
  const height =
    DESKTOP_STAGE_OFFSET +
    PADDING * 2 +
    rounds[0].matches.length * CARD_HEIGHT +
    (rounds[0].matches.length - 1) * ROW_GAP;

  return { positionedRounds, width, height };
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
        className="flex min-h-[28px] items-center rounded-xl border border-dashed px-2.5 py-1.5"
        style={{ borderColor: `${theme.accent}16`, background: `${theme.accent}05` }}>
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
      className={`flex min-h-[28px] items-center gap-2 rounded-xl px-2.5 py-1.5 ${
        align === 'right' ? 'flex-row-reverse text-right' : ''
      }`}
      style={{
        background: slot.isWinner
          ? `${theme.accent}18`
          : slot.status === 'confirmed'
            ? `${theme.accent}14`
            : `${theme.accent}09`,
        border: `1px solid ${
          slot.isWinner
            ? `${theme.accent}34`
            : slot.status === 'confirmed'
              ? `${theme.accent}28`
              : `${theme.accent}16`
        }`,
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
            style={{ color: slot.status === 'confirmed' ? theme.accent : 'var(--color-fg)' }}>
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
        <div className="truncate text-[9px] font-medium" style={{ color: `${theme.accent}40` }}>
          {owner}
        </div>
      </div>
      {slot.score !== null ? (
        <div
          className="font-display shrink-0 text-[18px] leading-none"
          style={{ color: slot.isWinner ? theme.accent : 'var(--color-fg)' }}>
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
        background: `linear-gradient(180deg, ${theme.card}f4 0%, ${theme.card}d5 100%)`,
        border: `1px solid ${theme.accent}18`,
        boxShadow: `0 20px 50px ${theme.bg}45`,
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
              className="font-heading text-[8px] font-bold uppercase tracking-[2px]"
              style={{ color: `${theme.accent}56` }}>
              Complete
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

export function KnockoutBracket({ bracket, ownerByTeam, theme }: Props) {
  const { positionedRounds, width, height } = buildDesktopLayout(bracket.rounds);
  const qualifiedThirdPlacedTeams = bracket.thirdPlaceStandings.filter((entry) => entry.qualified);

  return (
    <div className="space-y-6 md:space-y-8" data-reveal>
      <section
        className="relative overflow-hidden rounded-[30px] p-5 md:p-7"
        style={{
          background: `radial-gradient(circle at top left, ${theme.accent}1b 0%, transparent 30%), linear-gradient(180deg, ${theme.card}f6 0%, ${theme.card}d8 100%)`,
          border: `1px solid ${theme.accent}16`,
          boxShadow: `0 28px 90px ${theme.bg}45`,
        }}>
        <div
          className="pointer-events-none absolute -top-12 right-0 h-40 w-40 rounded-full blur-3xl"
          style={{ background: `${theme.accent}16` }}
        />

        <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div
              className="font-heading mb-2 text-[10px] font-bold uppercase tracking-[3px]"
              style={{ color: `${theme.accent}56` }}>
              Knockout View
            </div>
            <h3
              className="font-display text-[30px] leading-none tracking-[-0.04em] md:text-[46px]"
              style={{ color: theme.accent }}>
              Road to the final.
            </h3>
            <p
              className="mt-3 max-w-xl text-sm leading-6 md:text-[15px]"
              style={{ color: '#f3dec0' }}>
              The Round of 32 updates from the live group tables. Group winners and runners-up lock
              in as their sections finish, while third-place paths remain live projections until the
              bracket is fully set.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 md:grid-cols-1">
            <div
              className="rounded-2xl px-4 py-3"
              style={{
                background: `${theme.accent}0b`,
                border: `1px solid ${theme.accent}16`,
              }}>
              <div
                className="font-heading text-[9px] font-bold uppercase tracking-[2px]"
                style={{ color: `${theme.accent}44` }}>
                Groups complete
              </div>
              <div className="font-display mt-1 text-[22px]" style={{ color: theme.accent }}>
                {bracket.completedGroups}/{bracket.totalGroups}
              </div>
            </div>
            <div
              className="rounded-2xl px-4 py-3"
              style={{
                background: `${theme.accent}0b`,
                border: `1px solid ${theme.accent}16`,
              }}>
              <div
                className="font-heading text-[9px] font-bold uppercase tracking-[2px]"
                style={{ color: `${theme.accent}44` }}>
                Live third places
              </div>
              <div className="font-display mt-1 text-[22px]" style={{ color: theme.accent }}>
                {qualifiedThirdPlacedTeams.length}
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-6">
          <div
            className="font-heading mb-3 text-[9px] font-bold uppercase tracking-[2px]"
            style={{ color: `${theme.accent}44` }}>
            Current best third-placed teams
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-8">
            {qualifiedThirdPlacedTeams.map((entry) => (
              <div
                key={entry.group}
                className="rounded-2xl px-3 py-2.5"
                style={{
                  background: `${theme.accent}08`,
                  border: `1px solid ${theme.accent}14`,
                }}>
                <div className="flex items-center gap-2">
                  <Flag team={entry.team} size={16} />
                  <div className="min-w-0">
                    <div className="font-display truncate text-[11px]" style={{ color: '#f8e6c8' }}>
                      {shortTeamName(entry.team)}
                    </div>
                    <div
                      className="font-heading text-[8px] font-bold uppercase tracking-[2px]"
                      style={{ color: `${theme.accent}42` }}>
                      Group {entry.group} · {entry.pts} pts
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        className="overflow-hidden rounded-[30px] p-4 md:p-5"
        style={{
          background: `linear-gradient(180deg, ${theme.card}f2 0%, ${theme.card}d0 100%)`,
          border: `1px solid ${theme.accent}12`,
          boxShadow: `0 24px 80px ${theme.bg}38`,
        }}
        data-reveal>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <div
              className="font-heading text-[10px] font-bold uppercase tracking-[3px]"
              style={{ color: `${theme.accent}50` }}>
              Projected Bracket
            </div>
            <div
              className="font-display mt-1 text-[26px] leading-none tracking-[-0.03em] md:text-[34px]"
              style={{ color: theme.accent }}>
              Round of 32 to final
            </div>
          </div>
          <div
            className="font-heading hidden text-[9px] font-bold uppercase tracking-[2px] md:block"
            style={{ color: `${theme.accent}40` }}>
            Scroll horizontally to see the full path
          </div>
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <div className="relative" style={{ width, height }}>
            <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
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
                      stroke={`${theme.accent}28`}
                      strokeWidth="1.5"
                    />,
                    <line
                      key={`h2-${sibling.match.match}`}
                      x1={startX}
                      y1={sibling.centerY + DESKTOP_STAGE_OFFSET}
                      x2={branchX}
                      y2={sibling.centerY + DESKTOP_STAGE_OFFSET}
                      stroke={`${theme.accent}28`}
                      strokeWidth="1.5"
                    />,
                    <line
                      key={`v-${source.match.match}`}
                      x1={branchX}
                      y1={source.centerY + DESKTOP_STAGE_OFFSET}
                      x2={branchX}
                      y2={sibling.centerY + DESKTOP_STAGE_OFFSET}
                      stroke={`${theme.accent}28`}
                      strokeWidth="1.5"
                    />,
                    <line
                      key={`h3-${target.match.match}`}
                      x1={branchX}
                      y1={target.centerY + DESKTOP_STAGE_OFFSET}
                      x2={endX}
                      y2={target.centerY + DESKTOP_STAGE_OFFSET}
                      stroke={`${theme.accent}28`}
                      strokeWidth="1.5"
                    />,
                  ];
                })
              )}
            </svg>

            {bracket.rounds.map((round, roundIndex) => {
              const x = PADDING + roundIndex * (CARD_WIDTH + COLUMN_GAP);

              return (
                <div key={round.key}>
                  <div
                    className="absolute z-10"
                    style={{
                      left: x,
                      top: 0,
                      width: CARD_WIDTH,
                    }}>
                    <div
                      className="rounded-full px-3 py-2 text-center"
                      style={{
                        background: `${theme.accent}0b`,
                        border: `1px solid ${theme.accent}16`,
                      }}>
                      <div
                        className="font-heading text-[8px] font-bold uppercase tracking-[2px]"
                        style={{ color: `${theme.accent}42` }}>
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
                      style={{
                        left: matchX,
                        top: y + DESKTOP_STAGE_OFFSET,
                      }}>
                      <MatchCard match={match} ownerByTeam={ownerByTeam} theme={theme} />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        <div className="overflow-x-auto lg:hidden">
          <div className="flex w-max snap-x gap-4 pb-2">
            {bracket.rounds.map((round) => (
              <div
                key={round.key}
                className="w-[280px] shrink-0 snap-start space-y-3 rounded-[24px] p-3"
                style={{
                  background: `${theme.accent}05`,
                  border: `1px solid ${theme.accent}12`,
                }}>
                <div
                  className="rounded-2xl px-3 py-2"
                  style={{
                    background: `${theme.card}dd`,
                    border: `1px solid ${theme.accent}14`,
                  }}>
                  <div
                    className="font-heading text-[8px] font-bold uppercase tracking-[2px]"
                    style={{ color: `${theme.accent}42` }}>
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
          </div>
        </div>
      </section>
    </div>
  );
}
