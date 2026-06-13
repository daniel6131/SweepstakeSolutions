import { describe, expect, it } from 'vitest';

import { classifyAge, EXPIRED_MS, STALE_MS } from '@/lib/snapshot-freshness';

const NOW = 1_000_000_000;

describe('classifyAge', () => {
  it('reports missing when there is no snapshot', () => {
    expect(classifyAge(null, NOW)).toBe('missing');
    expect(classifyAge(undefined, NOW)).toBe('missing');
  });

  it('is fresh within the stale window (inclusive)', () => {
    expect(classifyAge(NOW, NOW)).toBe('fresh');
    expect(classifyAge(NOW - STALE_MS, NOW)).toBe('fresh');
  });

  it('is stale just past the stale window, up to expiry (inclusive)', () => {
    expect(classifyAge(NOW - STALE_MS - 1, NOW)).toBe('stale');
    expect(classifyAge(NOW - EXPIRED_MS, NOW)).toBe('stale');
  });

  it('is expired beyond the expiry window', () => {
    expect(classifyAge(NOW - EXPIRED_MS - 1, NOW)).toBe('expired');
    expect(classifyAge(NOW - 4 * 60 * 60 * 1000, NOW)).toBe('expired'); // 4h away
  });
});
