import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from './route';

function reportRequest(body: string): Request {
  return new Request('https://example.test/api/csp-report', {
    method: 'POST',
    headers: { 'content-type': 'application/csp-report' },
    body,
  });
}

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('POST /api/csp-report', () => {
  it('logs a violation report and returns 204', async () => {
    const warn = console.warn as unknown as ReturnType<typeof vi.fn>;
    const res = await POST(reportRequest('{"csp-report":{"violated-directive":"script-src"}}'));

    expect(res.status).toBe(204);
    const logged = warn.mock.calls.map((args) => args.join(' ')).join('\n');
    expect(logged).toContain('[csp-report]');
    expect(logged).toContain('script-src');
  });

  it('drops an oversized body but still returns 204', async () => {
    const warn = console.warn as unknown as ReturnType<typeof vi.fn>;
    const res = await POST(reportRequest('x'.repeat(9000)));

    expect(res.status).toBe(204);
    expect(warn).not.toHaveBeenCalled();
  });

  it('never throws on an unreadable body', async () => {
    const broken = {
      method: 'POST',
      text: async () => {
        throw new Error('stream error');
      },
    } as unknown as Request;

    const res = await POST(broken);
    expect(res.status).toBe(204);
  });
});
