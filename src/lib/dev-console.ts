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

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function isDevConsoleEnabled(): boolean {
  return !isProduction() || process.env.ENABLE_DEV_CONSOLE === 'true';
}

export function getDevConsolePasswordHash(): string | null {
  const password = process.env.DEV_CONSOLE_PASSWORD?.trim();
  if (!password) return null;
  return sha256(password);
}

export function isDevConsoleProtected(): boolean {
  return Boolean(getDevConsolePasswordHash());
}

// Console enabled in prod but no password set: lock it rather than hand out the
// score-override tools. Open locally where it's on by default.
function noPasswordAllows(): boolean {
  if (isProduction()) {
    console.error(
      '[dev-console] enabled in production with no DEV_CONSOLE_PASSWORD, denying access'
    );
    return false;
  }
  return true;
}

export function isValidDevConsolePassword(password: string): boolean {
  const expectedHash = getDevConsolePasswordHash();
  if (!expectedHash) return noPasswordAllows();
  return safeEqual(sha256(password), expectedHash);
}

export function isValidDevConsoleCookie(cookieValue: string | undefined): boolean {
  const expectedHash = getDevConsolePasswordHash();
  if (!expectedHash) return noPasswordAllows();
  if (!cookieValue) return false;
  return safeEqual(cookieValue, expectedHash);
}
