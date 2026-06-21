/**
 * GET  /api/draft  current draft state (organiser only)
 * POST /api/draft  run an action: start | draw | trade | lock | reset
 *
 * Both verbs need the draft session cookie. It's set by /draft/login and scoped
 * to '/' so it actually reaches here. No secret in prod means denied (see
 * isValidDraftCookie). Errors stay in the logs, callers just get a generic message.
 */

export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { GROUPS } from '@/data/groups';
import { DRAFT_COOKIE, isValidDraftCookie } from '@/lib/draft-auth';
import {
  drawNext,
  getDraftState,
  getPlayerConflicts,
  lockDraft,
  resetDraft,
  startDraft,
  tradePlayers,
} from '@/lib/draft-db';
import { clientIp, rateLimit } from '@/lib/rate-limit';

async function isAuthorized(): Promise<boolean> {
  const cookieStore = await cookies();
  return isValidDraftCookie(cookieStore.get(DRAFT_COOKIE)?.value);
}

function unauthorized(): NextResponse {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function GET() {
  if (!(await isAuthorized())) return unauthorized();

  try {
    const state = await getDraftState(GROUPS);
    const conflicts = getPlayerConflicts(state.assignments);
    return NextResponse.json({ ...state, conflicts });
  } catch (error) {
    console.error('[api/draft] GET failed:', error);
    return NextResponse.json({ error: 'Failed to load draft state' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isAuthorized())) return unauthorized();

  // even an authed session shouldn't be able to sit there hammering reset
  const limit = await rateLimit(`draft:${clientIp(request)}`, 30, 60);
  if (!limit.ok) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'start': {
        const state = await startDraft(GROUPS);
        return NextResponse.json(state);
      }

      case 'draw': {
        const { state, drawn } = await drawNext(GROUPS);
        const conflicts = getPlayerConflicts(state.assignments);
        return NextResponse.json({ ...state, conflicts, lastDrawn: drawn });
      }

      case 'trade': {
        const { player1, team1, player2, team2 } = body;
        if (!player1 || !team1 || !player2 || !team2) {
          return NextResponse.json({ error: 'Missing trade params' }, { status: 400 });
        }
        const state = await tradePlayers(player1, team1, player2, team2);
        const conflicts = getPlayerConflicts(state.assignments);
        return NextResponse.json({ ...state, conflicts });
      }

      case 'lock': {
        const state = await lockDraft();
        return NextResponse.json(state);
      }

      case 'reset': {
        const state = await resetDraft(GROUPS);
        return NextResponse.json(state);
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('[api/draft] POST failed:', error);
    return NextResponse.json({ error: 'Draft action failed' }, { status: 500 });
  }
}
