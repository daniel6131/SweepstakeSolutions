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

const CARD_WIDTH = 252;
const CARD_HEIGHT = 168;
const COLUMN_GAP = 64;
const ROW_GAP = 22;
const PADDING = 28;
const STAGE_OFFSET = 76;
const CORNER = 16;
const CHAMP_WIDTH = 232;
const CHAMP_HEIGHT = 168;

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
    STAGE_OFFSET +
    PADDING * 2 +
    rounds[0].matches.length * CARD_HEIGHT +
    (rounds[0].matches.length - 1) * ROW_GAP;

  return { positionedRounds, height };
}

/** Structured orthogonal elbow (H → V → H) with rounded corners, from a
 *  source card edge into the target. Degrades to a straight line when level. */
function elbowPath(startX: number, startY: number, endX: number, endY: number): string {
  const branchX = startX + (endX - startX) / 2;
  const dy = endY - startY;
  const r = Math.min(CORNER, Math.abs(dy) / 2, branchX - startX, endX - branchX);
  if (r < 1) return `M ${startX} ${startY} H ${endX}`;
  const s = dy >= 0 ? 1 : -1;
  return [
    `M ${startX} ${startY}`,
    `H ${branchX - r}`,
    `Q ${branchX} ${startY} ${branchX} ${startY + s * r}`,
    `V ${endY - s * r}`,
    `Q ${branchX} ${endY} ${branchX + r} ${endY}`,
    `H ${endX}`,
  ].join(' ');
}

function Slot({
  slot,
  ownerByTeam,
  theme,
  align,
}: {
  slot: KnockoutSlot;
  ownerByTeam: Map<string, string>;
  theme: ThemeColors;
  align: 'left' | 'right';
}) {
  const reverse = align === 'right';
  const owner = slot.team ? (ownerByTeam.get(slot.team) ?? null) : null;

  if (slot.status === 'placeholder') {
    return (
      <div
        className={`flex h-11.5 items-center gap-2 rounded-xl border border-dashed px-3 ${
          reverse ? 'flex-row-reverse text-right' : ''
        }`}
        style={{ borderColor: `${theme.accent}24`, background: `${theme.accent}06` }}>
        <span
          className="font-heading shrink-0 text-[9px] font-bold tracking-[2px]"
          style={{ color: `${theme.accent}46` }}>
          {slot.seedLabel}
        </span>
        <span
          className="font-heading truncate text-[10px] font-semibold tracking-[0.5px] uppercase"
          style={{ color: `${theme.accent}66` }}>
          {slot.label}
        </span>
      </div>
    );
  }

  const accentText =
    slot.isWinner || slot.status === 'confirmed' ? theme.accent : 'var(--color-fg)';

  return (
    <div
      className={`flex h-11.5 items-center gap-2.5 rounded-xl px-2.5 ${
        reverse ? 'flex-row-reverse text-right' : ''
      }`}
      style={{
        background: slot.isWinner ? `${theme.accent}1f` : `${theme.accent}0b`,
        border: `1px solid ${slot.isWinner ? `${theme.accent}4d` : `${theme.accent}1a`}`,
        boxShadow: slot.isWinner ? `inset 0 0 22px ${theme.accent}1f` : undefined,
      }}>
      <Flag team={slot.label} size={22} />
      <div className="min-w-0 flex-1">
        <div className={`flex items-center gap-1.5 ${reverse ? 'flex-row-reverse' : ''}`}>
          <span
            className="font-display truncate text-[13px] leading-tight"
            style={{ color: accentText }}>
            {shortTeamName(slot.label)}
          </span>
          <span
            className="font-heading shrink-0 rounded px-1 py-px text-[8px] font-bold tracking-[1px]"
            style={{ color: `${theme.accent}88`, background: `${theme.accent}14` }}>
            {slot.seedLabel}
          </span>
        </div>
        {owner ? (
          <div className="truncate text-[9px] font-medium" style={{ color: `${theme.accent}55` }}>
            {owner}
          </div>
        ) : null}
      </div>
      {slot.score !== null ? (
        <span
          className="font-display shrink-0 text-[22px] leading-none tabular-nums"
          style={{ color: slot.isWinner ? theme.accent : 'var(--color-fg-muted)' }}>
          {slot.score}
        </span>
      ) : null}
    </div>
  );
}

function MatchCard({
  match,
  ownerByTeam,
  theme,
  width,
}: {
  match: KnockoutMatch;
  ownerByTeam: Map<string, string>;
  theme: ThemeColors;
  width?: number;
}) {
  const projected = match.home.status === 'projected' || match.away.status === 'projected';

  return (
    <article
      className="flex flex-col overflow-hidden rounded-lg p-3"
      style={{
        width: width ?? CARD_WIDTH,
        height: CARD_HEIGHT,
        background: 'var(--card-surface)',
        border: match.isPlayed ? `1px solid ${theme.accent}3a` : '1px solid var(--card-border)',
        boxShadow: match.isPlayed
          ? `var(--card-highlight), var(--shadow-card), 0 0 30px -12px ${theme.accent}55`
          : 'var(--card-highlight), var(--shadow-card)',
      }}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span
          className="font-heading rounded-full px-2 py-0.5 text-[9px] font-bold tracking-[1.5px]"
          style={{ color: theme.bg, background: theme.accent }}>
          M{match.match}
        </span>
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{
              background: match.isPlayed ? theme.accent : `${theme.accent}40`,
              boxShadow: match.isPlayed ? `0 0 8px ${theme.accent}` : undefined,
            }}
          />
          <span
            className="font-heading text-[8px] font-bold tracking-[2px] uppercase"
            style={{ color: `${theme.accent}5a` }}>
            {match.isPlayed ? 'Full time' : projected ? 'Projected' : match.date}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-center gap-1.5">
        <Slot slot={match.home} ownerByTeam={ownerByTeam} theme={theme} align="left" />
        <Slot slot={match.away} ownerByTeam={ownerByTeam} theme={theme} align="right" />
      </div>

      <div
        className="font-heading mt-2 flex items-center justify-between gap-2 text-[8px] font-bold tracking-[1.5px] uppercase"
        style={{ color: `${theme.accent}40` }}>
        <span className="truncate">{match.venue}</span>
        <span className="shrink-0">{match.date}</span>
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
      className="relative flex flex-col items-center justify-center overflow-hidden rounded-lg p-4 text-center"
      style={{
        width,
        height: CHAMP_HEIGHT,
        background: `radial-gradient(120% 80% at 50% 0%, color-mix(in srgb, ${GOLD} 16%, transparent), transparent 70%), var(--card-surface)`,
        border: `1.5px solid color-mix(in srgb, ${GOLD} 55%, transparent)`,
        boxShadow: `var(--card-highlight), var(--shadow-card-lg), 0 24px 60px -26px color-mix(in srgb, ${GOLD} 75%, transparent)`,
      }}>
      <div
        className="pointer-events-none absolute -top-12 left-1/2 h-28 w-28 -translate-x-1/2 rounded-full blur-2xl"
        style={{ background: `color-mix(in srgb, ${GOLD} 32%, transparent)` }}
      />
      <Trophy size={26} style={{ color: GOLD }} strokeWidth={1.75} />
      <div
        className="font-heading mt-2 text-[9px] font-bold tracking-[3px] uppercase"
        style={{ color: GOLD }}>
        Champion
      </div>
      {team ? (
        <>
          <div className="mt-2.5 flex items-center gap-2">
            <Flag team={team} size={22} />
            <span className="font-display text-[16px]" style={{ color: 'var(--color-fg)' }}>
              {shortTeamName(team)}
            </span>
          </div>
          {owner ? (
            <div className="mt-0.5 text-[9px] font-medium" style={{ color: `${theme.accent}66` }}>
              {owner}
            </div>
          ) : null}
        </>
      ) : (
        <div
          className="font-display mt-2.5 text-[14px]"
          style={{ color: 'var(--color-fg-subtle)' }}>
          Awaiting the final
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
  const championTeam =
    finalMatch?.winner === 'home'
      ? finalMatch.home.team
      : finalMatch?.winner === 'away'
        ? finalMatch.away.team
        : null;
  const championOwner = championTeam ? (ownerByTeam.get(championTeam) ?? null) : null;

  const champX = PADDING + bracket.rounds.length * (CARD_WIDTH + COLUMN_GAP);
  const totalWidth = champX + CHAMP_WIDTH + PADDING;
  const champCenterY = finalPos ? finalPos.centerY + STAGE_OFFSET : 0;

  return (
    <div className="space-y-6 md:space-y-8" data-reveal>
      {/* ── Knockout title card ── */}
      <section
        className="relative overflow-hidden rounded-[30px] p-6 md:p-9"
        style={{
          background: `radial-gradient(120% 130% at 100% 0%, color-mix(in srgb, ${GOLD} 13%, transparent) 0%, transparent 42%), radial-gradient(110% 130% at 0% 100%, ${theme.accent}16 0%, transparent 48%), var(--card-surface)`,
          border: '1px solid var(--card-border)',
          boxShadow: 'var(--card-highlight), var(--shadow-card-lg)',
        }}>
        <div
          className="bg-grain pointer-events-none absolute inset-0"
          style={{ opacity: 0.05, mixBlendMode: 'overlay' }}
        />

        <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <div
              className="font-heading mb-3 flex items-center gap-2 text-[10px] font-bold tracking-[3px] uppercase"
              style={{ color: `${theme.accent}72` }}>
              <Trophy size={13} strokeWidth={2} style={{ color: GOLD }} />
              Knockout Stage · 2026
            </div>
            <h3
              className="font-display text-[44px] leading-[0.88] tracking-[-0.04em] md:text-[64px]"
              style={{ color: 'var(--color-fg)' }}>
              Road to the{' '}
              <span
                style={{
                  color: GOLD,
                  textShadow: `0 0 44px color-mix(in srgb, ${GOLD} 55%, transparent)`,
                }}>
                final
              </span>
            </h3>
          </div>

          <div className="flex shrink-0 items-center gap-7 md:gap-9">
            <div>
              <div
                className="font-display text-[40px] leading-none tabular-nums md:text-[48px]"
                style={{ color: theme.accent }}>
                {bracket.completedGroups}
                <span style={{ color: `${theme.accent}40` }}>/{bracket.totalGroups}</span>
              </div>
              <div
                className="font-heading mt-2 text-[9px] font-bold tracking-[2px] uppercase"
                style={{ color: `${theme.accent}55` }}>
                Groups complete
              </div>
            </div>
            <div className="h-11 w-px" style={{ background: `${theme.accent}22` }} />
            <div>
              <div
                className="font-display text-[40px] leading-none tabular-nums md:text-[48px]"
                style={{ color: theme.accent }}>
                {qualifiedThirdPlacedTeams.length}
              </div>
              <div
                className="font-heading mt-2 text-[9px] font-bold tracking-[2px] uppercase"
                style={{ color: `${theme.accent}55` }}>
                Thirds qualifying
              </div>
            </div>
          </div>
        </div>

        <div
          className="relative z-10 mt-7 border-t pt-5"
          style={{ borderColor: 'var(--card-border)' }}>
          <div
            className="font-heading mb-3 text-[9px] font-bold tracking-[2px] uppercase"
            style={{ color: `${theme.accent}50` }}>
            Best third-placed teams · live
          </div>
          <div className="flex flex-wrap gap-2">
            {qualifiedThirdPlacedTeams.map((entry) => (
              <div
                key={entry.group}
                className="flex items-center gap-2 rounded-full py-1.5 pr-3 pl-1.5"
                style={{ background: `${theme.accent}0c`, border: '1px solid var(--card-border)' }}>
                <Flag team={entry.team} size={18} />
                <span className="font-display text-[12px]" style={{ color: 'var(--color-fg)' }}>
                  {shortTeamName(entry.team)}
                </span>
                <span
                  className="font-heading text-[8px] font-bold tracking-[1.5px] uppercase"
                  style={{ color: `${theme.accent}55` }}>
                  Grp {entry.group}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Projected bracket ── */}
      <section
        className="relative overflow-hidden rounded-[30px] p-4 md:p-5"
        style={{
          background: `radial-gradient(90% 120% at 100% 50%, ${theme.accent}12 0%, transparent 55%), var(--card-surface)`,
          border: '1px solid var(--card-border)',
          boxShadow: 'var(--card-highlight), var(--shadow-card-lg)',
        }}
        data-reveal>
        <div className="relative z-10 mb-4 flex items-center justify-between gap-3">
          <div>
            <div
              className="font-heading text-[10px] font-bold tracking-[3px] uppercase"
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
            className="font-heading hidden text-[9px] font-bold tracking-[2px] uppercase md:block"
            style={{ color: `${theme.accent}45` }}>
            Scroll horizontally to follow the path →
          </div>
        </div>

        {/* Desktop tree */}
        <div className="relative z-10 hidden overflow-x-auto lg:block">
          <div className="relative" style={{ width: totalWidth, height }}>
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              fill="none"
              aria-hidden="true">
              <defs>
                <linearGradient id="ko-flow" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={`${theme.accent}38`} />
                  <stop offset="55%" stopColor={`${theme.accent}80`} />
                  <stop offset="100%" stopColor={theme.accent} />
                </linearGradient>
              </defs>
              {positionedRounds.slice(0, -1).flatMap((round, roundIndex) =>
                round.flatMap((source, matchIndex) => {
                  if (matchIndex % 2 !== 0) return [];
                  const sibling = round[matchIndex + 1];
                  const target = positionedRounds[roundIndex + 1][Math.floor(matchIndex / 2)];
                  const startX = source.x + CARD_WIDTH;
                  const endX = target.x;
                  const topY = source.centerY + STAGE_OFFSET;
                  const botY = sibling.centerY + STAGE_OFFSET;
                  const midY = target.centerY + STAGE_OFFSET;
                  const dTop = elbowPath(startX, topY, endX, midY);
                  const dBot = elbowPath(startX, botY, endX, midY);
                  const k = source.match.match;
                  return [
                    // soft glow underlay
                    <path
                      key={`gt-${k}`}
                      d={dTop}
                      stroke={theme.accent}
                      strokeOpacity={0.1}
                      strokeWidth={6}
                      strokeLinecap="round"
                    />,
                    <path
                      key={`gb-${k}`}
                      d={dBot}
                      stroke={theme.accent}
                      strokeOpacity={0.1}
                      strokeWidth={6}
                      strokeLinecap="round"
                    />,
                    // crisp connecting lines
                    <path
                      key={`t-${k}`}
                      d={dTop}
                      stroke="url(#ko-flow)"
                      strokeWidth={2}
                      strokeLinecap="round"
                    />,
                    <path
                      key={`b-${k}`}
                      d={dBot}
                      stroke="url(#ko-flow)"
                      strokeWidth={2}
                      strokeLinecap="round"
                    />,
                  ];
                })
              )}
              {finalPos ? (
                <>
                  <path
                    d={elbowPath(finalPos.x + CARD_WIDTH, champCenterY, champX, champCenterY)}
                    style={{ stroke: GOLD, strokeOpacity: 0.16 }}
                    strokeWidth={8}
                    strokeLinecap="round"
                  />
                  <path
                    d={elbowPath(finalPos.x + CARD_WIDTH, champCenterY, champX, champCenterY)}
                    style={{ stroke: GOLD }}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                  />
                </>
              ) : null}
            </svg>

            {bracket.rounds.map((round, roundIndex) => {
              const x = PADDING + roundIndex * (CARD_WIDTH + COLUMN_GAP);
              return (
                <div key={round.key}>
                  <div className="absolute z-10" style={{ left: x, top: 0, width: CARD_WIDTH }}>
                    <div
                      className="rounded-full px-3 py-2 text-center backdrop-blur-sm"
                      style={{
                        background: `${theme.accent}10`,
                        border: '1px solid var(--card-border)',
                      }}>
                      <div
                        className="font-heading text-[8px] font-bold tracking-[2px] uppercase"
                        style={{ color: `${theme.accent}55` }}>
                        {round.shortTitle}
                      </div>
                      <div className="font-display mt-0.5 text-sm" style={{ color: theme.accent }}>
                        {round.title}
                      </div>
                    </div>
                  </div>
                  {positionedRounds[roundIndex].map(({ match, x: matchX, y }) => (
                    <div
                      key={match.match}
                      className="absolute z-10"
                      style={{ left: matchX, top: y + STAGE_OFFSET }}>
                      <MatchCard match={match} ownerByTeam={ownerByTeam} theme={theme} />
                    </div>
                  ))}
                </div>
              );
            })}

            {finalPos ? (
              <>
                <div className="absolute z-10" style={{ left: champX, top: 0, width: CHAMP_WIDTH }}>
                  <div
                    className="rounded-full px-3 py-2 text-center"
                    style={{
                      background: `color-mix(in srgb, ${GOLD} 12%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${GOLD} 38%, transparent)`,
                    }}>
                    <div
                      className="font-heading text-[8px] font-bold tracking-[2px] uppercase"
                      style={{ color: `color-mix(in srgb, ${GOLD} 75%, transparent)` }}>
                      Winner
                    </div>
                    <div className="font-display mt-0.5 text-sm" style={{ color: GOLD }}>
                      Champion
                    </div>
                  </div>
                </div>
                <div
                  className="absolute z-10"
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
        <div className="relative z-10 overflow-x-auto lg:hidden">
          <div className="flex w-max gap-4 pb-2">
            {bracket.rounds.map((round) => (
              <div
                key={round.key}
                className="w-70 shrink-0 space-y-3 rounded-3xl p-3"
                style={{ background: `${theme.accent}06`, border: '1px solid var(--card-border)' }}>
                <div
                  className="rounded-2xl px-3 py-2"
                  style={{
                    background: 'var(--card-surface)',
                    border: '1px solid var(--card-border)',
                  }}>
                  <div
                    className="font-heading text-[8px] font-bold tracking-[2px] uppercase"
                    style={{ color: `${theme.accent}55` }}>
                    {round.shortTitle}
                  </div>
                  <div className="font-display mt-0.5 text-[20px]" style={{ color: theme.accent }}>
                    {round.title}
                  </div>
                </div>
                {round.matches.map((match) => (
                  <MatchCard
                    key={match.match}
                    match={match}
                    ownerByTeam={ownerByTeam}
                    theme={theme}
                    width={256}
                  />
                ))}
              </div>
            ))}

            {finalMatch ? (
              <div
                className="flex w-60 shrink-0 flex-col gap-3 rounded-3xl p-3"
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
                    className="font-heading text-[8px] font-bold tracking-[2px] uppercase"
                    style={{ color: `color-mix(in srgb, ${GOLD} 75%, transparent)` }}>
                    Winner
                  </div>
                  <div className="font-display mt-0.5 text-[20px]" style={{ color: GOLD }}>
                    Champion
                  </div>
                </div>
                <ChampionCard team={championTeam} owner={championOwner} theme={theme} width={216} />
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
