import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// In-memory KV double so the persistence layer round-trips without real KV or
// touching the local filesystem. `set` honours { nx } so the write lock behaves.
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
    expire: async () => 1,
  };
  return { store, fakeKv };
});

vi.mock('@vercel/kv', () => ({ kv: h.fakeKv, createClient: () => h.fakeKv }));

import { drawNext, getDraftState, lockDraft, resetDraft, startDraft } from './draft-db';

beforeEach(() => {
  h.store.clear();
  process.env.KV_REST_API_URL = 'https://stub.kv';
  delete process.env.KV_REST_API_READ_ONLY_TOKEN;
});

afterEach(() => {
  delete process.env.KV_REST_API_URL;
});

describe('draft-db persistence through KV', () => {
  it('round-trips the started state', async () => {
    const started = await startDraft();
    expect(started.status).toBe('drafting');
    expect(started.playerOrder).toHaveLength(12);

    const reread = await getDraftState();
    expect(reread.status).toBe('drafting');
  });

  it('persists a drawn assignment', async () => {
    await startDraft();
    const { state, drawn } = await drawNext();
    expect(drawn.team).toBeTruthy();
    expect(state.assignments).toHaveLength(1);

    const reread = await getDraftState();
    expect(reread.assignments).toHaveLength(1);
    expect(reread.assignments[0]?.team).toBe(drawn.team);
  });

  it('runs a full draft, locks it, and writes an immutable backup', async () => {
    await startDraft();
    let state = await getDraftState();
    let guard = 0;
    while (state.status === 'drafting' && guard < 60) {
      ({ state } = await drawNext());
      guard += 1;
    }
    expect(state.status).toBe('trading');
    expect(state.assignments).toHaveLength(48);

    const locked = await lockDraft();
    expect(locked.status).toBe('locked');
    expect(h.store.get('draft:locked:latest')).toBeTruthy();
  });

  it('reset clears assignments back to pending', async () => {
    await startDraft();
    await drawNext();
    const reset = await resetDraft();
    expect(reset.status).toBe('pending');
    expect(reset.assignments).toHaveLength(0);
  });
});
