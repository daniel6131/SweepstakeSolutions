import { describe, expect, it } from 'vitest';

import { isUpstreamCoolingOff, markUpstreamCooloff } from './upstream-cooloff';

// No KV in the test env, so the breaker is a no-op (never blocks a fetch).
describe('upstream cooloff', () => {
  it('reports not cooling off and marking is a no-op without KV', async () => {
    await expect(isUpstreamCoolingOff()).resolves.toBe(false);
    await expect(markUpstreamCooloff(30)).resolves.toBeUndefined();
    await expect(isUpstreamCoolingOff()).resolves.toBe(false);
  });
});
