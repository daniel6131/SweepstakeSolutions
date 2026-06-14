/* eslint-disable @next/next/no-img-element */
/**
 * The Position Card: a 1080x1350 shareable PNG for a player's STANDING. A
 * distinct, dramatic design from the Fate Card — the rank is a giant cinematic
 * hero, with a bold scoreboard of points, goal difference and W-D-L record, and
 * a points-by-team bar chart of the squad. Satori-only (flexbox, literal colors).
 */

import { ordinalSuffix } from '@/lib/ledger-format';

type CardTeam = { team: string; pts: number; flagUrl: string };

export type PositionShareCardProps = {
  name: string;
  rank: number;
  totalPlayers: number;
  points: number;
  w: number;
  d: number;
  l: number;
  gd: number;
  gf: number;
  ga: number;
  gapToLeader: number;
  teams: CardTeam[];
};

const C = {
  bg0: '#002629',
  bg1: '#001012',
  surface: '#00363b',
  accent: '#94FFE4',
  accent2: '#06D6A0',
  fg: '#FBFBFB',
  fgMuted: 'rgba(251,251,251,0.66)',
  fgSubtle: 'rgba(251,251,251,0.42)',
  hair: 'rgba(148,255,228,0.16)',
  success: '#4ADE80',
  amber: '#FFAC47',
  danger: '#F87171',
};

function positionWord(rank: number, total: number): string {
  if (rank === 1) return 'TOURNAMENT LEADER';
  if (rank <= 3) return 'ON THE PODIUM';
  if (rank === total) return 'ROCK BOTTOM';
  if (rank <= total / 2) return 'IN THE HUNT';
  return 'OFF THE PACE';
}

function fmtGD(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}

function StatTile({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        backgroundColor: C.surface,
        border: `1px solid ${C.hair}`,
        borderRadius: 18,
        padding: '22px 26px',
      }}>
      <div
        style={{
          display: 'flex',
          fontFamily: 'Space Grotesk',
          fontWeight: 700,
          fontSize: 16,
          letterSpacing: 3,
          color: C.fgSubtle,
        }}>
        {label}
      </div>
      <div style={{ display: 'flex', fontFamily: 'Anton', fontSize: 92, color, lineHeight: 1.05 }}>
        {value}
      </div>
    </div>
  );
}

function RecordCell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ display: 'flex', fontFamily: 'Anton', fontSize: 54, color, lineHeight: 1 }}>
        {value}
      </div>
      <div
        style={{
          display: 'flex',
          fontFamily: 'Space Grotesk',
          fontWeight: 700,
          fontSize: 14,
          letterSpacing: 2,
          color: C.fgSubtle,
          marginTop: 6,
        }}>
        {label}
      </div>
    </div>
  );
}

/** Bar height (px) scaled to a team's points, with a small stub for zero. */
function barHeight(pts: number, maxPts: number): number {
  const STUB = 8;
  const MAX = 176;
  return STUB + (maxPts > 0 ? (pts / maxPts) * (MAX - STUB) : 0);
}

export function PositionShareCard(props: PositionShareCardProps) {
  const { name, rank, totalPlayers, points, w, d, l, gd, gf, ga, gapToLeader, teams } = props;
  const rankColor = rank <= 3 ? C.accent : C.fg;
  const rankSize = rank >= 10 ? 220 : 320;
  const gdColor = gd > 0 ? C.success : gd < 0 ? C.danger : C.fgSubtle;
  const gapText = rank === 1 ? 'Clear at the summit' : `${gapToLeader} pts off the lead`;
  const maxTeamPts = Math.max(0, ...teams.map((t) => t.pts));

  return (
    <div
      style={{
        width: 1080,
        height: 1350,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        backgroundColor: C.bg0,
        backgroundImage: `linear-gradient(155deg, ${C.bg0} 0%, ${C.bg1} 100%)`,
        color: C.fg,
        fontFamily: 'DM Sans',
        padding: 64,
      }}>
      <div
        style={{
          position: 'absolute',
          top: -240,
          right: -200,
          width: 1000,
          height: 1000,
          display: 'flex',
          backgroundImage:
            'radial-gradient(circle at center, rgba(148,255,228,0.18), rgba(148,255,228,0) 62%)',
        }}
      />

      {/* header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div
          style={{
            display: 'flex',
            backgroundColor: C.accent,
            color: C.bg0,
            fontFamily: 'Space Grotesk',
            fontWeight: 700,
            fontSize: 22,
            letterSpacing: 2,
            padding: '8px 16px',
            borderRadius: 999,
          }}>
          WORLD CUP 2026
        </div>
        <div
          style={{
            display: 'flex',
            fontFamily: 'Space Grotesk',
            fontWeight: 700,
            fontSize: 18,
            letterSpacing: 4,
            color: C.fgSubtle,
          }}>
          STANDINGS
        </div>
      </div>

      {/* hero: position */}
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 28 }}>
        <div
          style={{
            display: 'flex',
            fontFamily: 'Space Grotesk',
            fontWeight: 700,
            fontSize: 22,
            letterSpacing: 6,
            color: C.accent,
          }}>
          CURRENT POSITION
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 30 }}>
          <div
            style={{
              display: 'flex',
              width: 12,
              height: rankSize * 0.6,
              backgroundColor: rankColor,
              borderRadius: 6,
              marginRight: 30,
            }}
          />
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <span
              style={{
                fontFamily: 'Anton',
                fontSize: rankSize,
                lineHeight: 0.82,
                color: rankColor,
              }}>
              {rank}
            </span>
            <span
              style={{
                fontFamily: 'Anton',
                fontSize: rankSize * 0.26,
                color: rankColor,
                marginTop: 16,
                marginLeft: 4,
              }}>
              {ordinalSuffix(rank)}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 36, marginTop: 14 }}>
            <span
              style={{
                display: 'flex',
                fontFamily: 'Space Grotesk',
                fontWeight: 700,
                fontSize: 26,
                letterSpacing: 2,
                color: C.fgMuted,
              }}>
              {`OF ${totalPlayers}`}
            </span>
            <span
              style={{
                display: 'flex',
                fontFamily: 'Anton',
                fontSize: 40,
                color: C.accent,
                marginTop: 10,
                lineHeight: 1,
              }}>
              {positionWord(rank, totalPlayers)}
            </span>
            <span
              style={{
                display: 'flex',
                fontFamily: 'DM Sans',
                fontWeight: 500,
                fontSize: 22,
                color: C.fgMuted,
                marginTop: 10,
              }}>
              {gapText}
            </span>
          </div>
        </div>
      </div>

      {/* name */}
      <div
        style={{
          display: 'flex',
          fontFamily: 'Anton',
          fontSize: 76,
          color: C.fg,
          letterSpacing: -1,
          lineHeight: 1,
          marginTop: 26,
        }}>
        {name.toUpperCase()}
      </div>

      {/* points + goal difference */}
      <div style={{ display: 'flex', marginTop: 24 }}>
        <div style={{ display: 'flex', flex: 1, marginRight: 16 }}>
          <StatTile label="POINTS" value={`${points}`} color={C.accent} />
        </div>
        <div style={{ display: 'flex', flex: 1 }}>
          <StatTile label="GOAL DIFFERENCE" value={fmtGD(gd)} color={gdColor} />
        </div>
      </div>

      {/* record */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: C.surface,
          border: `1px solid ${C.hair}`,
          borderRadius: 18,
          padding: '22px 18px',
          marginTop: 14,
        }}>
        <RecordCell label="WON" value={`${w}`} color={C.success} />
        <RecordCell label="DRAWN" value={`${d}`} color={C.amber} />
        <RecordCell label="LOST" value={`${l}`} color={C.danger} />
        <RecordCell label="FOR : AGAINST" value={`${gf}:${ga}`} color={C.fg} />
      </div>

      {/* points-by-team bar chart */}
      <div
        style={{
          display: 'flex',
          fontFamily: 'Space Grotesk',
          fontWeight: 700,
          fontSize: 18,
          letterSpacing: 4,
          color: C.fgSubtle,
          marginTop: 26,
        }}>
        POINTS WON BY TEAM
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          height: 230,
          marginTop: 18,
          borderBottom: `2px solid ${C.hair}`,
        }}>
        {teams.map((t) => (
          <div
            key={t.team}
            style={{
              display: 'flex',
              flex: 1,
              height: '100%',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-end',
            }}>
            <span
              style={{
                display: 'flex',
                fontFamily: 'Anton',
                fontSize: 38,
                color: t.pts > 0 ? C.accent : C.fgSubtle,
                marginBottom: 10,
                lineHeight: 1,
              }}>
              {t.pts}
            </span>
            <div
              style={{
                display: 'flex',
                width: 78,
                height: barHeight(t.pts, maxTeamPts),
                borderTopLeftRadius: 10,
                borderTopRightRadius: 10,
                backgroundImage: `linear-gradient(180deg, ${C.accent} 0%, ${C.accent2} 100%)`,
              }}
            />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', marginTop: 16 }}>
        {teams.map((t) => (
          <div key={t.team} style={{ display: 'flex', flex: 1, justifyContent: 'center' }}>
            {t.flagUrl ? (
              <img
                src={t.flagUrl}
                alt=""
                width={48}
                height={32}
                style={{ borderRadius: 5, objectFit: 'cover', border: `1px solid ${C.hair}` }}
              />
            ) : (
              <div
                style={{
                  display: 'flex',
                  width: 48,
                  height: 32,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderRadius: 5,
                }}
              />
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexGrow: 1 }} />

      {/* footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 20,
        }}>
        <div
          style={{
            display: 'flex',
            fontFamily: 'Space Grotesk',
            fontWeight: 700,
            fontSize: 18,
            letterSpacing: 3,
            color: C.fgSubtle,
          }}>
          USA · MEXICO · CANADA
        </div>
        <div
          style={{
            display: 'flex',
            fontFamily: 'Space Grotesk',
            fontWeight: 700,
            fontSize: 16,
            letterSpacing: 3,
            color: C.fgSubtle,
          }}>
          THE SWEEPSTAKE
        </div>
      </div>
    </div>
  );
}
