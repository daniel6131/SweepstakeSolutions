import { NextResponse } from 'next/server';

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // unsafe-eval/inline required by Next.js dev
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://flagcdn.com",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://api.football-data.org",
    "frame-ancestors 'none'",
  ].join('; '),
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
