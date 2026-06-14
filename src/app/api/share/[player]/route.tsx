/**
 * Share-card image route: GET /api/share/<player> -> a 1080x1350 PNG of that
 * player's hand. Reads the canonical snapshot (no extra football-data.org
 * calls), so it rides the same cache as the rest of the app and degrades
 * gracefully rather than throwing to the user.
 */

import { ImageResponse } from 'next/og';
import { after } from 'next/server';

import { FateShareCard } from '@/components/share/FateShareCard';
import { PositionShareCard } from '@/components/share/PositionShareCard';
import { COUNTRY_CODES } from '@/data/countryCodes';
import { mockSweepstakeData } from '@/lib/mock-data';
import { loadOgFonts } from '@/lib/og-fonts';
import { getSnapshotForRead } from '@/lib/refresh-snapshot';

export const dynamic = 'force-dynamic';

function flagUrlFor(team: string): string {
  const code = COUNTRY_CODES[team];
  return code ? `https://flagcdn.com/w160/${code}.png` : '';
}

export async function GET(req: Request, ctx: { params: Promise<{ player: string }> }) {
  const { player } = await ctx.params;
  const name = decodeURIComponent(player);
  const url = new URL(req.url);
  const origin = url.origin;

  const { snapshot, background } = await getSnapshotForRead();
  if (background) after(background);

  // `?demo` mirrors the app's demo mode so the share preview matches what's on screen.
  const data = url.searchParams.has('demo') ? mockSweepstakeData(snapshot.data) : snapshot.data;

  // `?card=standing` renders the dramatic Position card from the leaderboard
  // (no ledger dependency); the default renders the Fate card from the hand.
  if (url.searchParams.get('card') === 'standing') {
    const idx = data.leaderboard.findIndex((e) => e.name.toLowerCase() === name.toLowerCase());
    if (idx < 0) return new Response('Player not found', { status: 404 });
    const lb = data.leaderboard[idx]!;
    const leaderPts = data.leaderboard[0]?.pts ?? lb.pts;
    // Per-team points come from the ledger when present; degrade to 0 otherwise.
    const ledgerEntry = data.ledger?.entries.find(
      (e) => e.name.toLowerCase() === lb.name.toLowerCase()
    );
    const teams = ledgerEntry
      ? ledgerEntry.teams.map((t) => ({ team: t.team, pts: t.pts, flagUrl: flagUrlFor(t.team) }))
      : lb.teams.map((t) => ({ team: t, pts: 0, flagUrl: flagUrlFor(t) }));
    const fonts = await loadOgFonts(origin);
    return new ImageResponse(
      <PositionShareCard
        name={lb.name}
        rank={idx + 1}
        totalPlayers={data.leaderboard.length}
        points={lb.pts}
        w={lb.w}
        d={lb.d}
        l={lb.l}
        gd={lb.gd}
        gf={lb.gf}
        ga={lb.ga}
        gapToLeader={Math.max(0, leaderPts - lb.pts)}
        teams={teams}
      />,
      {
        width: 1080,
        height: 1350,
        fonts: fonts.map((f) => ({ name: f.name, data: f.data, weight: f.weight, style: f.style })),
        headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
      }
    );
  }

  const entry = data.ledger?.entries.find((e) => e.name.toLowerCase() === name.toLowerCase());
  if (!entry) {
    return new Response('Player not found', { status: 404 });
  }

  const leaderboard = data.leaderboard;
  const lbIndex = leaderboard.findIndex((e) => e.name === entry.name);
  const lb = lbIndex >= 0 ? leaderboard[lbIndex] : null;
  const rank = lbIndex >= 0 ? lbIndex + 1 : data.ledger.entries.indexOf(entry) + 1;
  const totalPlayers = leaderboard.length || data.ledger.entries.length;
  const leaderPts = leaderboard[0]?.pts ?? entry.actualPts;
  const gapToLeader = Math.max(0, leaderPts - entry.actualPts);
  const record = lb ? { w: lb.w, d: lb.d, l: lb.l, gd: lb.gd, played: lb.w + lb.d + lb.l } : null;

  const teams = entry.teams.map((t) => ({
    team: t.team,
    pot: t.pot,
    pts: t.pts,
    potRank: t.potRank,
    potSize: t.potSize,
    verdict: t.verdict,
    flagUrl: flagUrlFor(t.team),
  }));

  const byDelta = [...entry.teams].sort((a, b) => b.delta - a.delta);
  const top = byDelta[0];
  const bottom = byDelta[byDelta.length - 1];
  const best = top ? { team: top.team, delta: top.delta } : null;
  const worst = bottom && bottom !== top ? { team: bottom.team, delta: bottom.delta } : null;

  const fonts = await loadOgFonts(origin);

  return new ImageResponse(
    <FateShareCard
      name={entry.name}
      rank={rank}
      totalPlayers={totalPlayers}
      points={entry.actualPts}
      fateDelta={entry.fateDelta}
      parPts={entry.parPts}
      gapToLeader={gapToLeader}
      record={record}
      teams={teams}
      best={best}
      worst={worst}
      diverges={data.ledger.divergesFromLeaderboard}
      giftedCount={entry.teams.filter((t) => t.verdict === 'GIFTED').length}
      robbedCount={entry.teams.filter((t) => t.verdict === 'ROBBED').length}
    />,
    {
      width: 1080,
      height: 1350,
      fonts: fonts.map((f) => ({ name: f.name, data: f.data, weight: f.weight, style: f.style })),
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    }
  );
}
