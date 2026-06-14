/**
 * The Fate Card: a 1080x1350 shareable PNG of a player's hand, rendered by
 * Satori (next/og). Satori is flexbox-only with literal color strings (no CSS
 * vars, no box-shadow blur, no grid), so this is a standalone layout, not a
 * reuse of the on-screen LedgerHandCard markup.
 */

import type { DraftPot } from '@/data/draftPots';
import type { PotVerdict } from '@/lib/ledger-of-fate';
import { POT_LABEL, fmtSigned, ordinalSuffix } from '@/lib/ledger-format';

type CardTeam = {
  team: string;
  pot: DraftPot;
  pts: number;
  potRank: number;
  potSize: number;
  verdict: PotVerdict;
  flagUrl: string;
};

export type FateShareCardProps = {
  name: string;
  rank: number;
  totalPlayers: number;
  points: number;
  fateDelta: number;
  parPts: number;
  gapToLeader: number;
  record: { w: number; d: number; l: number; gd: number; played: number } | null;
  teams: CardTeam[];
  best: { team: string; delta: number } | null;
  worst: { team: string; delta: number } | null;
  diverges: boolean;
  giftedCount: number;
  robbedCount: number;
};

const C = {
  bg0: '#002629',
  bg1: '#001214',
  surface: '#00363b',
  accent: '#94FFE4',
  accent2: '#06D6A0',
  fg: '#FBFBFB',
  fgMuted: 'rgba(251,251,251,0.66)',
  fgSubtle: 'rgba(251,251,251,0.42)',
  hair: 'rgba(148,255,228,0.16)',
  success: '#4ADE80',
  danger: '#F87171',
};

function verdictStyle(v: PotVerdict) {
  if (v === 'GIFTED')
    return {
      bg: 'rgba(74,222,128,0.12)',
      border: 'rgba(74,222,128,0.45)',
      edge: C.success,
      chipBg: C.success,
      chipFg: '#04231a',
    };
  if (v === 'ROBBED')
    return {
      bg: 'rgba(248,113,113,0.12)',
      border: 'rgba(248,113,113,0.45)',
      edge: C.danger,
      chipBg: C.danger,
      chipFg: '#2a0a0a',
    };
  return {
    bg: C.surface,
    border: 'rgba(148,255,228,0.14)',
    edge: 'rgba(148,255,228,0.3)',
    chipBg: 'transparent',
    chipFg: C.fgMuted,
  };
}

function nameFontSize(name: string): number {
  const n = name.length;
  if (n > 13) return 78;
  if (n > 9) return 98;
  return 118;
}

function Tile({ t }: { t: CardTeam }) {
  const vs = verdictStyle(t.verdict);
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: 452,
        backgroundColor: vs.bg,
        border: `1px solid ${vs.border}`,
        borderLeft: `6px solid ${vs.edge}`,
        borderRadius: 16,
        padding: 22,
      }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {t.flagUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={t.flagUrl}
            alt=""
            width={72}
            height={48}
            style={{
              borderRadius: 6,
              objectFit: 'cover',
              border: '1px solid rgba(148,255,228,0.18)',
            }}
          />
        ) : (
          <div
            style={{
              display: 'flex',
              width: 72,
              height: 48,
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: 6,
            }}
          />
        )}
        <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 16 }}>
          <div
            style={{
              display: 'flex',
              fontFamily: 'Anton',
              fontSize: 34,
              color: C.fg,
              lineHeight: 1,
            }}>
            {t.team.toUpperCase()}
          </div>
          <div
            style={{
              display: 'flex',
              fontFamily: 'Space Grotesk',
              fontWeight: 600,
              fontSize: 16,
              letterSpacing: 2,
              color: C.fgSubtle,
              marginTop: 5,
            }}>
            {`${POT_LABEL[t.pot].toUpperCase()} · ${t.pts} PTS`}
          </div>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 18,
        }}>
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 28, color: C.fg }}>
            {`${t.potRank}${ordinalSuffix(t.potRank)}`}
          </span>
          <span
            style={{
              fontFamily: 'Space Grotesk',
              fontWeight: 600,
              fontSize: 18,
              color: C.fgSubtle,
              marginLeft: 6,
            }}>
            {`of ${t.potSize}`}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            fontFamily: 'Space Grotesk',
            fontWeight: 700,
            fontSize: 16,
            letterSpacing: 1,
            color: t.verdict === 'PAR' ? C.fgMuted : vs.chipFg,
            backgroundColor: vs.chipBg,
            border: t.verdict === 'PAR' ? '1px solid rgba(251,251,251,0.4)' : 'none',
            borderRadius: 8,
            padding: '6px 12px',
          }}>
          {t.verdict}
        </div>
      </div>
    </div>
  );
}

export function FateShareCard(props: FateShareCardProps) {
  const {
    name,
    rank,
    totalPlayers,
    points,
    fateDelta,
    parPts,
    gapToLeader,
    record,
    teams,
    best,
    worst,
    diverges,
    giftedCount,
    robbedCount,
  } = props;

  const overPar = fateDelta >= 0;
  const standingLine =
    rank === 1
      ? 'Top of the sweepstake'
      : `${rank}${ordinalSuffix(rank)} of ${totalPlayers} · ${gapToLeader} behind the leader`;
  const bestWorst =
    best && worst
      ? `BEST: ${best.team.toUpperCase()} ${fmtSigned(best.delta)}   WORST: ${worst.team.toUpperCase()} ${fmtSigned(worst.delta)}`
      : null;

  return (
    <div
      style={{
        width: 1080,
        height: 1350,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        backgroundColor: C.bg0,
        backgroundImage: `linear-gradient(160deg, ${C.bg0} 0%, ${C.bg1} 100%)`,
        color: C.fg,
        fontFamily: 'DM Sans',
        padding: 64,
      }}>
      {/* floodlight glow */}
      <div
        style={{
          position: 'absolute',
          top: -220,
          left: -160,
          width: 900,
          height: 900,
          display: 'flex',
          backgroundImage:
            'radial-gradient(circle at center, rgba(148,255,228,0.18), rgba(148,255,228,0) 60%)',
        }}
      />

      {/* header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
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
              color: C.fgSubtle,
              fontFamily: 'Space Grotesk',
              fontWeight: 600,
              fontSize: 18,
              letterSpacing: 4,
              marginTop: 12,
            }}>
            USA · MEXICO · CANADA
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 150,
            padding: '12px 24px',
            borderRadius: 20,
            backgroundColor: 'rgba(148,255,228,0.08)',
            border: `2px solid ${C.accent}`,
          }}>
          {rank === 1 ? (
            <div style={{ display: 'flex', fontFamily: 'Anton', fontSize: 46, color: C.accent }}>
              LEADER
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                style={{
                  display: 'flex',
                  fontFamily: 'Anton',
                  fontSize: 68,
                  color: C.accent,
                  lineHeight: 1,
                }}>
                {rank}
              </div>
              <div
                style={{
                  display: 'flex',
                  fontFamily: 'Space Grotesk',
                  fontWeight: 700,
                  fontSize: 18,
                  letterSpacing: 3,
                  color: C.fgMuted,
                  marginTop: 2,
                }}>
                {`OF ${totalPlayers}`}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* name */}
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 44 }}>
        <div
          style={{
            display: 'flex',
            fontFamily: 'Space Grotesk',
            fontWeight: 700,
            fontSize: 22,
            letterSpacing: 6,
            color: C.accent,
          }}>
          THE HAND FATE DEALT
        </div>
        <div
          style={{
            display: 'flex',
            fontFamily: 'Anton',
            fontSize: nameFontSize(name),
            color: C.fg,
            lineHeight: 0.96,
            letterSpacing: -1,
            marginTop: 10,
          }}>
          {name.toUpperCase()}
        </div>
        <div
          style={{
            display: 'flex',
            fontFamily: 'DM Sans',
            fontWeight: 500,
            fontSize: 24,
            color: C.fgMuted,
            marginTop: 14,
          }}>
          {standingLine}
        </div>
      </div>

      {/* stat strip */}
      <div style={{ display: 'flex', marginTop: 32 }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            backgroundColor: C.surface,
            border: `1px solid ${C.hair}`,
            borderRadius: 18,
            padding: '20px 26px',
            marginRight: 16,
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
            POINTS
          </div>
          <div
            style={{
              display: 'flex',
              fontFamily: 'Anton',
              fontSize: 66,
              color: C.fg,
              lineHeight: 1.05,
            }}>
            {points}
          </div>
          {record ? (
            <div
              style={{
                display: 'flex',
                fontFamily: 'DM Sans',
                fontWeight: 500,
                fontSize: 18,
                color: C.fgMuted,
                marginTop: 6,
              }}>
              {`P${record.played} · ${record.w}-${record.d}-${record.l} · GD ${record.gd > 0 ? '+' : ''}${record.gd}`}
            </div>
          ) : null}
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            backgroundColor: C.surface,
            border: `1px solid ${C.hair}`,
            borderRadius: 18,
            padding: '20px 26px',
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
            ± VS PAR
          </div>
          <div
            style={{
              display: 'flex',
              fontFamily: 'Anton',
              fontSize: 66,
              color: overPar ? C.success : C.danger,
              lineHeight: 1.05,
            }}>
            {fmtSigned(fateDelta)}
          </div>
          <div
            style={{
              display: 'flex',
              fontFamily: 'DM Sans',
              fontWeight: 500,
              fontSize: 18,
              color: C.fgMuted,
              marginTop: 6,
            }}>
            {`average hand scores ${parPts.toFixed(1)}`}
          </div>
        </div>
      </div>

      {/* squad */}
      <div
        style={{
          display: 'flex',
          fontFamily: 'Space Grotesk',
          fontWeight: 700,
          fontSize: 18,
          letterSpacing: 4,
          color: C.fgSubtle,
          marginTop: 34,
        }}>
        YOUR FOUR NATIONS
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: 16, gap: 16 }}>
        {teams.map((t) => (
          <Tile key={t.team} t={t} />
        ))}
      </div>

      {/* spacer */}
      <div style={{ display: 'flex', flexGrow: 1 }} />

      {/* footer */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          borderTop: `1px solid ${C.hair}`,
          paddingTop: 22,
        }}>
        {diverges ? (
          <div
            style={{
              display: 'flex',
              alignSelf: 'flex-start',
              fontFamily: 'Anton',
              fontSize: 24,
              color: C.bg0,
              backgroundColor: C.accent2,
              padding: '6px 14px',
              borderRadius: 8,
              marginBottom: 16,
              transform: 'rotate(-2deg)',
            }}>
            FATE FLIPPED THE TABLE
          </div>
        ) : null}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                display: 'flex',
                fontFamily: 'Space Grotesk',
                fontWeight: 700,
                fontSize: 24,
                color: C.fg,
              }}>
              {`GIFTED ×${giftedCount} · ROBBED ×${robbedCount}`}
            </div>
            {bestWorst ? (
              <div
                style={{
                  display: 'flex',
                  fontFamily: 'DM Sans',
                  fontWeight: 500,
                  fontSize: 18,
                  color: C.fgMuted,
                  marginTop: 6,
                }}>
                {bestWorst}
              </div>
            ) : null}
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
            SWEEPSTAKE · LEDGER OF FATE
          </div>
        </div>
      </div>
    </div>
  );
}
