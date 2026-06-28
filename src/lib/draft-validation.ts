/**
 * Server-side validation for the /api/draft request body. Small and hand-rolled
 * (no schema dependency for five actions) but strict: reject anything that isn't
 * a known action with the right shape before it reaches the persistence layer.
 */

export type DraftAction = 'start' | 'draw' | 'trade' | 'lock' | 'reset';

const ACTIONS: readonly DraftAction[] = ['start', 'draw', 'trade', 'lock', 'reset'];

export type TradeParams = { player1: string; team1: string; player2: string; team2: string };

export type DraftCommand =
  | { action: 'start' | 'draw' | 'lock' | 'reset' }
  | ({ action: 'trade' } & TradeParams);

export type ValidationResult = { ok: true; command: DraftCommand } | { ok: false; error: string };

function isShortString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= 64;
}

export function validateDraftCommand(body: unknown): ValidationResult {
  if (typeof body !== 'object' || body === null) {
    return { ok: false, error: 'Invalid body' };
  }
  const record = body as Record<string, unknown>;
  const action = record.action;

  if (typeof action !== 'string' || !ACTIONS.includes(action as DraftAction)) {
    return { ok: false, error: 'Unknown action' };
  }

  if (action === 'trade') {
    const { player1, team1, player2, team2 } = record;
    if (![player1, team1, player2, team2].every(isShortString)) {
      return { ok: false, error: 'Missing or invalid trade params' };
    }
    return {
      ok: true,
      command: {
        action,
        player1: player1 as string,
        team1: team1 as string,
        player2: player2 as string,
        team2: team2 as string,
      },
    };
  }

  return { ok: true, command: { action: action as 'start' | 'draw' | 'lock' | 'reset' } };
}
