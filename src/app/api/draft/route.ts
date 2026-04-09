/**
 * GET  /api/draft         → current draft state
 * POST /api/draft         → perform an action
 *   body: { action: 'start' | 'draw' | 'trade' | 'lock' | 'reset', ...params }
 */

import {
  drawNext,
  getDraftState,
  getPlayerConflicts,
  lockDraft,
  resetDraft,
  startDraft,
  tradePlayers,
} from '@/lib/draft-db';
import { loadCurrentTournamentGroups } from '@/lib/current-tournament';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const groups = await loadCurrentTournamentGroups();
    const state = getDraftState(groups);
    const conflicts = getPlayerConflicts(state.assignments);
    return NextResponse.json({ ...state, conflicts });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;
    const groups = await loadCurrentTournamentGroups();

    switch (action) {
      case 'start': {
        const state = startDraft(groups);
        return NextResponse.json(state);
      }

      case 'draw': {
        const { state, drawn } = drawNext(groups);
        const conflicts = getPlayerConflicts(state.assignments);
        return NextResponse.json({ ...state, conflicts, lastDrawn: drawn });
      }

      case 'trade': {
        const { player1, team1, player2, team2 } = body;
        if (!player1 || !team1 || !player2 || !team2) {
          return NextResponse.json({ error: 'Missing trade params' }, { status: 400 });
        }
        const state = tradePlayers(player1, team1, player2, team2);
        const conflicts = getPlayerConflicts(state.assignments);
        return NextResponse.json({ ...state, conflicts });
      }

      case 'lock': {
        const state = lockDraft();
        return NextResponse.json(state);
      }

      case 'reset': {
        const state = resetDraft(groups);
        return NextResponse.json(state);
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
