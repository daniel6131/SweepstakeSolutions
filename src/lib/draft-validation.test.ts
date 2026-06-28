import { describe, expect, it } from 'vitest';

import { validateDraftCommand } from './draft-validation';

describe('validateDraftCommand', () => {
  it('accepts the simple actions', () => {
    for (const action of ['start', 'draw', 'lock', 'reset'] as const) {
      const result = validateDraftCommand({ action });
      expect(result.ok).toBe(true);
    }
  });

  it('accepts a well-formed trade', () => {
    const result = validateDraftCommand({
      action: 'trade',
      player1: 'Adam',
      team1: 'Brazil',
      player2: 'Daniel',
      team2: 'France',
    });
    expect(result).toEqual({
      ok: true,
      command: {
        action: 'trade',
        player1: 'Adam',
        team1: 'Brazil',
        player2: 'Daniel',
        team2: 'France',
      },
    });
  });

  it('rejects an unknown action', () => {
    expect(validateDraftCommand({ action: 'drop-table' })).toEqual({
      ok: false,
      error: 'Unknown action',
    });
  });

  it('rejects a non-object body', () => {
    expect(validateDraftCommand('reset').ok).toBe(false);
    expect(validateDraftCommand(null).ok).toBe(false);
  });

  it('rejects a trade with missing or non-string params', () => {
    expect(validateDraftCommand({ action: 'trade', player1: 'Adam' }).ok).toBe(false);
    expect(
      validateDraftCommand({
        action: 'trade',
        player1: 'Adam',
        team1: 'Brazil',
        player2: 'Daniel',
        team2: 42,
      }).ok
    ).toBe(false);
  });

  it('rejects over-long strings (cheap abuse guard)', () => {
    const huge = 'x'.repeat(200);
    expect(
      validateDraftCommand({
        action: 'trade',
        player1: huge,
        team1: 'Brazil',
        player2: 'Daniel',
        team2: 'France',
      }).ok
    ).toBe(false);
  });
});
