/**
 * GET  /api/draft  current draft state (organiser only)
 * POST /api/draft  run an action: start | draw | trade | lock | reset
 *
 * Both verbs need the draft session cookie. It's set by /draft/login and scoped
 * to '/' so it actually reaches here. No secret in prod means denied (see
 * isValidDraftCookie). Errors stay in the logs, callers just get a generic message.
 */

export const dynamic = 'force-dynamic';

import { createHash } from 'node:crypto';

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { GROUPS } from '@/data/groups';
import { recordAudit } from '@/lib/audit-log';
import { DRAFT_COOKIE, isValidDraftCookie } from '@/lib/draft-auth';
import {
  drawNext,
  getDraftState,
  getPlayerConflicts,
  lockDraft,
  resetDraft,
  startDraft,
  tradePlayers,
  type DraftState,
} from '@/lib/draft-db';
import { validateDraftCommand } from '@/lib/draft-validation';
import { clientIp, rateLimit } from '@/lib/rate-limit';

async function isAuthorized(): Promise<boolean> {
  const cookieStore = await cookies();
  return isValidDraftCookie(cookieStore.get(DRAFT_COOKIE)?.value);
}

function unauthorized(): NextResponse {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// short fingerprint of the assignments, so the audit trail shows what changed
function hashAssignments(state: DraftState): string {
  return createHash('sha256')
    .update(JSON.stringify(state.assignments ?? []))
    .digest('hex')
    .slice(0, 12);
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = validateDraftCommand(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const command = parsed.command;
  const actor = clientIp(request);

  try {
    // snapshot the prior assignments so the audit entry shows the before/after
    const before = await getDraftState(GROUPS);
    const beforeHash = hashAssignments(before);

    let payload: unknown;
    let after: DraftState;
    switch (command.action) {
      case 'start': {
        after = await startDraft(GROUPS);
        payload = after;
        break;
      }
      case 'draw': {
        const { state, drawn } = await drawNext(GROUPS);
        after = state;
        payload = { ...state, conflicts: getPlayerConflicts(state.assignments), lastDrawn: drawn };
        break;
      }
      case 'trade': {
        after = await tradePlayers(command.player1, command.team1, command.player2, command.team2);
        payload = { ...after, conflicts: getPlayerConflicts(after.assignments) };
        break;
      }
      case 'lock': {
        after = await lockDraft();
        payload = after;
        break;
      }
      case 'reset': {
        after = await resetDraft(GROUPS);
        payload = after;
        break;
      }
      default: {
        const exhaustive: never = command;
        throw new Error(`unreachable: ${JSON.stringify(exhaustive)}`);
      }
    }

    await recordAudit({
      category: 'draft',
      action: command.action,
      actor,
      detail: `before=${beforeHash} after=${hashAssignments(after)} status=${after.status}`,
    });

    return NextResponse.json(payload);
  } catch (error) {
    console.error('[api/draft] POST failed:', error);
    const busy = error instanceof Error && error.message.startsWith('busy:');
    return NextResponse.json(
      { error: busy ? 'Draft is busy, try again' : 'Draft action failed' },
      { status: busy ? 409 : 500 }
    );
  }
}
