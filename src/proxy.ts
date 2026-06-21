import { NextResponse } from 'next/server';

const isProd = process.env.NODE_ENV === 'production';

// Next still needs inline scripts for hydration/streaming (no nonce wired up
// yet), so 'unsafe-inline' stays on script-src. 'unsafe-eval' is only the dev
// tooling (HMR), so it's dev-only: in prod the eval sink is closed.
const scriptSrc = isProd
  ? "script-src 'self' 'unsafe-inline'"
  : "script-src 'self' 'unsafe-eval' 'unsafe-inline'";

const CSP = [
  "default-src 'self'",
  scriptSrc,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://flagcdn.com",
  // next/font self-hosts the fonts under /_next, so 'self' covers them (no gstatic)
  "font-src 'self'",
  // football-data.org is only ever called server-side, so the browser only talks
  // to our own origin: the page, /api/*, and the same-origin Vercel beacons
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(isProd ? ['upgrade-insecure-requests'] : []),
].join('; ');

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Content-Security-Policy': CSP,
};

export function proxy() {
  const response = NextResponse.next();
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export const config = {
  matcher: [
    /*
     * Apply to all routes except Next.js internals and static files.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
