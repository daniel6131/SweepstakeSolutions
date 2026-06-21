import { describe, expect, it } from 'vitest';

import { withLock } from './kv-lock';

// No KV in the test env, so this exercises the in-process fallback lock.
describe('withLock', () => {
  it('returns the wrapped function result', async () => {
    await expect(withLock('lock-result', 5, async () => 42)).resolves.toBe(42);
  });

  it('serialises concurrent holders of the same key', async () => {
    let active = 0;
    let maxActive = 0;
    const task = () =>
      withLock('lock-serial', 5, async () => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        await new Promise((r) => setTimeout(r, 20));
        active -= 1;
      });

    await Promise.all([task(), task(), task()]);
    expect(maxActive).toBe(1);
  });

  it('releases the lock even when the function throws', async () => {
    await expect(
      withLock('lock-throw', 5, async () => {
        throw new Error('boom');
      })
    ).rejects.toThrow('boom');
    // a subsequent acquire of the same key still succeeds
    await expect(withLock('lock-throw', 5, async () => 'ok')).resolves.toBe('ok');
  });
});
