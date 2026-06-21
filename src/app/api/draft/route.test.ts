import { createHash } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// `vi.mock` is hoisted above the module body, so anything its factory references
// must be created with `vi.hoisted` (also hoisted) to avoid a TDZ error.
const mocks = vi.hoisted(() => ({
  resetDraft: vi.fn(async () => ({ status: 'pending', assignments: [] })),
  getDraftState: vi.fn(async () => ({ status: 'pending', assignments: [] })),
  startDraft: vi.fn(async () => ({ status: 'drafting', assignments: [] })),
  drawNext: vi.fn(),
  lockDraft: vi.fn(),
  tradePlayers: vi.fn(),
  getPlayerConflicts: vi.fn(() => []),
  // Mutable holder for the session cookie the handler will read.
  cookie: undefined as string | undefined,
}));

// Mock the persistence layer so the handler never touches KV / the filesystem.
vi.mock('@/lib/draft-db', () => ({
  resetDraft: mocks.resetDraft,
  getDraftState: mocks.getDraftState,
  startDraft: mocks.startDraft,
  drawNext: mocks.drawNext,
  lockDraft: mocks.lockDraft,
  tradePlayers: mocks.tradePlayers,
  getPlayerConflicts: mocks.getPlayerConflicts,
}));

// The audit log writes to KV; stub it so the handler stays self-contained.
vi.mock('@/lib/audit-log', () => ({ recordAudit: vi.fn() }));

// Controllable session cookie.
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: () => (mocks.cookie ? { value: mocks.cookie } : undefined),
  }),
}));

import { GET, POST } from './route';

const SECRET = 'test-secret';
const validHash = createHash('sha256').update(SECRET).digest('hex');

function postReq(body: unknown): Request {
  return new Request('http://localhost/api/draft', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': '1.2.3.4' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.DRAFT_SECRET = SECRET;
  mocks.cookie = undefined;
});

afterEach(() => {
  delete process.env.DRAFT_SECRET;
});

describe('/api/draft authentication', () => {
  it('rejects GET without a valid session cookie', async () => {
    const res = await GET();
    expect(res.status).toBe(401);
    expect(mocks.getDraftState).not.toHaveBeenCalled();
  });

  it('rejects an unauthenticated reset (the critical vulnerability)', async () => {
    const res = await POST(postReq({ action: 'reset' }));
    expect(res.status).toBe(401);
    expect(mocks.resetDraft).not.toHaveBeenCalled();
  });

  it('accepts a reset when a valid cookie is present', async () => {
    mocks.cookie = validHash;
    const res = await POST(postReq({ action: 'reset' }));
    expect(res.status).toBe(200);
    expect(mocks.resetDraft).toHaveBeenCalledOnce();
  });

  it('returns 400 for an unknown action when authenticated (no input reflected)', async () => {
    mocks.cookie = validHash;
    const res = await POST(postReq({ action: 'definitely-not-a-real-action' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Unknown action');
  });

  it('rejects a tampered cookie value', async () => {
    mocks.cookie = 'not-the-right-hash';
    const res = await POST(postReq({ action: 'reset' }));
    expect(res.status).toBe(401);
    expect(mocks.resetDraft).not.toHaveBeenCalled();
  });

  it('returns 400 for a non-JSON body', async () => {
    mocks.cookie = validHash;
    const req = new Request('http://localhost/api/draft', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '1.2.3.4' },
      body: 'definitely not json',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(mocks.resetDraft).not.toHaveBeenCalled();
  });

  it('returns 400 for a trade missing params', async () => {
    mocks.cookie = validHash;
    const res = await POST(postReq({ action: 'trade', player1: 'Adam' }));
    expect(res.status).toBe(400);
    expect(mocks.tradePlayers).not.toHaveBeenCalled();
  });

  it('dispatches a valid trade', async () => {
    mocks.cookie = validHash;
    mocks.tradePlayers.mockResolvedValueOnce({ status: 'trading', assignments: [] });
    const res = await POST(
      postReq({
        action: 'trade',
        player1: 'Adam',
        team1: 'Brazil',
        player2: 'Daniel',
        team2: 'France',
      })
    );
    expect(res.status).toBe(200);
    expect(mocks.tradePlayers).toHaveBeenCalledWith('Adam', 'Brazil', 'Daniel', 'France');
  });
});
