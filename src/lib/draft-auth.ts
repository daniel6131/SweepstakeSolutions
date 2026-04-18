import { createHash, timingSafeEqual } from 'node:crypto';

export const DRAFT_COOKIE = 'sweepstake-draft';

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function getDraftSecretHash(): string | null {
  const secret = process.env.DRAFT_SECRET?.trim();
  if (!secret) return null;
  return sha256(secret);
}

export function isDraftProtected(): boolean {
  return Boolean(getDraftSecretHash());
}

export function isValidDraftPassword(password: string): boolean {
  const expected = getDraftSecretHash();
  if (!expected) return true;
  return safeEqual(sha256(password), expected);
}

export function isValidDraftCookie(cookieValue: string | undefined): boolean {
  const expected = getDraftSecretHash();
  if (!expected) return true;
  if (!cookieValue) return false;
  return safeEqual(cookieValue, expected);
}
