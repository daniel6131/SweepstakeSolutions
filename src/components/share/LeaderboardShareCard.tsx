/* eslint-disable @next/next/no-img-element */
/**
 * The Standings Card: a 1080x1350 shareable PNG of the whole leaderboard.
 * Satori-only (flexbox, literal colors), matching the Fate Card aesthetic.
 */

export type StandingRow = {
  rank: number;
  name: string;
  pts: number;
  gap: number;
  flagUrls: string[];
};

export type LeaderboardShareCardProps = {
  rows: StandingRow[];
};

const C = {
  bg0: '#002629',
  bg1: '#001214',
  surface: '#00363b',
  accent: '#94FFE4',
  fg: '#FBFBFB',
  fgMuted: 'rgba(251,251,251,0.66)',
  fgSubtle: 'rgba(251,251,251,0.42)',
  hair: 'rgba(148,255,228,0.14)',
};

function Row({ r }: { r: StandingRow }) {
  const isLeader = r.rank === 1;
  const top3 = r.rank <= 3;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '11px 18px',
        borderRadius: isLeader ? 14 : 0,
        backgroundColor: isLeader ? 'rgba(148,255,228,0.12)' : 'transparent',
        // Build borders conditionally: Satori calls .trim() on style values and
        // throws on an undefined border-*, so never include one.
        ...(isLeader
          ? { border: `1px solid ${C.accent}` }
          : r.rank > 1
            ? { borderTop: `1px solid ${C.hair}` }
            : {}),
      }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span
          style={{
            display: 'flex',
            width: 50,
            fontFamily: 'Anton',
            fontSize: 38,
            color: top3 ? C.accent : C.fgSubtle,
          }}>
          {r.rank}
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 8 }}>
          <span
            style={{
              display: 'flex',
              fontFamily: 'Anton',
              fontSize: 30,
              color: C.fg,
              lineHeight: 1,
            }}>
            {r.name.toUpperCase()}
          </span>
          <div style={{ display: 'flex', marginTop: 7 }}>
            {r.flagUrls.map((u, i) =>
              u ? (
                <img
                  key={i}
                  src={u}
                  alt=""
                  width={26}
                  height={17}
                  style={{
                    borderRadius: 3,
                    objectFit: 'cover',
                    marginRight: 6,
                    border: '1px solid rgba(148,255,228,0.18)',
                  }}
                />
              ) : (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    width: 26,
                    height: 17,
                    marginRight: 6,
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderRadius: 3,
                  }}
                />
              )
            )}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        <span
          style={{
            display: 'flex',
            fontFamily: 'Anton',
            fontSize: 40,
            color: isLeader ? C.accent : C.fg,
            lineHeight: 1,
          }}>
          {r.pts}
        </span>
        <span
          style={{
            display: 'flex',
            fontFamily: 'Space Grotesk',
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: 1,
            color: isLeader ? C.accent : C.fgSubtle,
            marginTop: 4,
          }}>
          {isLeader ? 'LEADER' : `-${r.gap}`}
        </span>
      </div>
    </div>
  );
}

export function LeaderboardShareCard({ rows }: LeaderboardShareCardProps) {
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
        padding: '52px 56px',
      }}>
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
            color: C.fgSubtle,
            fontFamily: 'Space Grotesk',
            fontWeight: 600,
            fontSize: 18,
            letterSpacing: 4,
          }}>
          USA · MEXICO · CANADA
        </div>
      </div>

      {/* title */}
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 26 }}>
        <div
          style={{
            display: 'flex',
            fontFamily: 'Space Grotesk',
            fontWeight: 700,
            fontSize: 22,
            letterSpacing: 6,
            color: C.accent,
          }}>
          THE SWEEPSTAKE
        </div>
        <div
          style={{
            display: 'flex',
            fontFamily: 'Anton',
            fontSize: 96,
            color: C.fg,
            lineHeight: 0.96,
            letterSpacing: -1,
            marginTop: 6,
          }}>
          STANDINGS
        </div>
      </div>

      {/* table */}
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 24 }}>
        {rows.map((r) => (
          <Row key={r.name} r={r} />
        ))}
      </div>

      <div style={{ display: 'flex', flexGrow: 1 }} />

      {/* footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: `1px solid ${C.hair}`,
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
          12 PLAYERS · 48 NATIONS
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
  );
}
