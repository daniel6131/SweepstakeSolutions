import { createHash } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  getDraftSecretHash,
  isDraftProtected,
  isValidDraftCookie,
  isValidDraftPassword,
} from './draft-auth';
import {
  isDevConsoleEnabled,
  isValidDevConsoleCookie,
  isValidDevConsolePassword,
} from './dev-console';

const sha = (s: string) => createHash('sha256').update(s).digest('hex');

afterEach(() => {
  delete process.env.DRAFT_SECRET;
  delete process.env.DEV_CONSOLE_PASSWORD;
  delete process.env.ENABLE_DEV_CONSOLE;
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('draft-auth', () => {
  it('validates the password and cookie against the configured secret', () => {
    process.env.DRAFT_SECRET = 's3cret';
    expect(isDraftProtected()).toBe(true);
    expect(getDraftSecretHash()).toBe(sha('s3cret'));
    expect(isValidDraftPassword('s3cret')).toBe(true);
    expect(isValidDraftPassword('wrong')).toBe(false);
    expect(isValidDraftCookie(sha('s3cret'))).toBe(true);
    expect(isValidDraftCookie('nope')).toBe(false);
    expect(isValidDraftCookie(undefined)).toBe(false);
  });

  it('stays open with no secret outside production (dev convenience)', () => {
    expect(isValidDraftCookie(undefined)).toBe(true);
    expect(isValidDraftPassword('anything')).toBe(true);
  });

  it('fails closed with no secret in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(isValidDraftCookie(sha('whatever'))).toBe(false);
    expect(isValidDraftPassword('whatever')).toBe(false);
  });
});

describe('dev-console auth', () => {
  it('is enabled in dev and validates against the configured password', () => {
    expect(isDevConsoleEnabled()).toBe(true);
    process.env.DEV_CONSOLE_PASSWORD = 'pw';
    expect(isValidDevConsolePassword('pw')).toBe(true);
    expect(isValidDevConsolePassword('bad')).toBe(false);
    expect(isValidDevConsoleCookie(sha('pw'))).toBe(true);
  });

  it('fails closed when enabled in production without a password', () => {
    vi.stubEnv('NODE_ENV', 'production');
    process.env.ENABLE_DEV_CONSOLE = 'true';
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(isDevConsoleEnabled()).toBe(true);
    expect(isValidDevConsoleCookie(sha('whatever'))).toBe(false);
    expect(isValidDevConsolePassword('whatever')).toBe(false);
  });
});
