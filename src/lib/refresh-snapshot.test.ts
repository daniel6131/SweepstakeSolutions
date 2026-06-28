import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

import { getSnapshotForRead } from './refresh-snapshot';

beforeEach(() => {
  h.store.clear();
  process.env.KV_REST_API_URL = 'https://stub.kv';
  delete process.env.KV_REST_API_READ_ONLY_TOKEN;
});

afterEach(() => {
  delete process.env.KV_REST_API_URL;
});

describe('getSnapshotForRead', () => {
  it('serves a fresh snapshot without triggering a refresh', async () => {
    // Has ledger + provisional (so it does not look like it predates a field)
    // and a current timestamp, so it classifies as fresh.
    const snapshot = { data: { ledger: {}, provisional: {} }, updatedAt: Date.now() };
    h.store.set('sweepstake:snapshot', snapshot);

    const { snapshot: out, background } = await getSnapshotForRead();
    expect(out.updatedAt).toBe(snapshot.updatedAt);
    expect(background).toBeNull();
  });
});
