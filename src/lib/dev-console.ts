import { createHash, timingSafeEqual } from 'node:crypto';

export const DEV_CONSOLE_COOKIE = 'sweepstake-dev-console';

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  if (left.length !== right.length) return false;

  return timingSafeEqual(left, right);
}

export function isDevConsoleEnabled(): boolean {
  return process.env.NODE_ENV !== 'production' || process.env.ENABLE_DEV_CONSOLE === 'true';
}

export function getDevConsolePasswordHash(): string | null {
  const password = process.env.DEV_CONSOLE_PASSWORD?.trim();
  if (!password) return null;
  return sha256(password);
}

export function isDevConsoleProtected(): boolean {
  return Boolean(getDevConsolePasswordHash());
}

export function isValidDevConsolePassword(password: string): boolean {
  const expectedHash = getDevConsolePasswordHash();
  if (!expectedHash) return true;
  return safeEqual(sha256(password), expectedHash);
}

export function isValidDevConsoleCookie(cookieValue: string | undefined): boolean {
  const expectedHash = getDevConsolePasswordHash();
  if (!expectedHash) return true;
  if (!cookieValue) return false;
  return safeEqual(cookieValue, expectedHash);
}
