import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ kv: { get: vi.fn(async () => null as unknown) } }));

vi.mock('@vercel/kv', () => ({ kv: h.kv, createClient: () => h.kv }));
vi.mock('@/lib/upstream-cooloff', () => ({ isUpstreamCoolingOff: async () => false }));

import { GET } from './route';

beforeEach(() => {
  process.env.KV_REST_API_URL = 'https://stub.kv';
  h.kv.get.mockReset().mockResolvedValue(null);
});

afterEach(() => {
  delete process.env.KV_REST_API_URL;
});

describe('GET /api/health', () => {
  it('returns 200 ok when KV is reachable', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ status: 'ok', kv: 'ok', upstreamCooloff: false });
  });

  it('returns 503 degraded when KV is down', async () => {
    h.kv.get.mockRejectedValueOnce(new Error('kv unreachable'));
    const res = await GET();
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body).toMatchObject({ status: 'degraded', kv: 'down' });
  });

  it('reports kv disabled without KV configured', async () => {
    delete process.env.KV_REST_API_URL;
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.kv).toBe('disabled');
  });
});
