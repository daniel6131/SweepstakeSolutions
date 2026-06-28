import { afterEach, describe, expect, it, vi } from 'vitest';

import { readAudit, recordAudit } from './audit-log';

afterEach(() => vi.restoreAllMocks());

// No KV in the test env: entries still echo to stdout, KV persistence is skipped.
describe('audit log', () => {
  it('echoes to stdout and never throws without KV', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    await expect(
      recordAudit({ category: 'auth', action: 'draft-login-fail', actor: '1.2.3.4' })
    ).resolves.toBeUndefined();
    expect(info).toHaveBeenCalledOnce();
    expect(info.mock.calls[0]?.join(' ')).toContain('draft-login-fail');
  });

  it('returns an empty history without KV', async () => {
    await expect(readAudit()).resolves.toEqual([]);
  });
});
