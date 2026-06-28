import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { SweepstakeData } from './load-data';

const h = vi.hoisted(() => {
  const store = new Map<string, unknown>();
  const fakeKv = {
    get: async (k: string) => store.get(k) ?? null,
    set: async (k: string, v: unknown, opts?: { nx?: boolean }) => {
      if (opts?.nx && store.has(k)) return null;
      store.set(k, v);
      return 'OK';
    },
    del: async (k: string) => {
      store.delete(k);
    },
  };
  return { store, fakeKv };
});

vi.mock('@vercel/kv', () => ({ kv: h.fakeKv, createClient: () => h.fakeKv }));

import { acquireRefreshLock, readSnapshot, releaseRefreshLock, writeSnapshot } from './snapshot-db';

beforeEach(() => {
  h.store.clear();
  process.env.KV_REST_API_URL = 'https://stub.kv';
  delete process.env.KV_REST_API_READ_ONLY_TOKEN;
});

afterEach(() => {
  delete process.env.KV_REST_API_URL;
});

describe('snapshot-db', () => {
  it('round-trips a snapshot', async () => {
    const data = { dataSource: 'static' } as unknown as SweepstakeData;
    const written = await writeSnapshot(data, 1234);
    expect(written).toEqual({ data, updatedAt: 1234 });

    const read = await readSnapshot();
    expect(read).toEqual({ data, updatedAt: 1234 });
  });

  it('returns null when no snapshot exists', async () => {
    await expect(readSnapshot()).resolves.toBeNull();
  });

  it('refresh lock is exclusive, then re-acquirable after release', async () => {
    expect(await acquireRefreshLock(15)).toBe(true);
    expect(await acquireRefreshLock(15)).toBe(false);
    await releaseRefreshLock();
    expect(await acquireRefreshLock(15)).toBe(true);
  });
});
