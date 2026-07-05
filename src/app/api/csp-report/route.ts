import { NextResponse } from 'next/server';

/**
 * CSP violation sink. Browsers POST here via the `report-uri` / `report-to`
 * directives in the Content-Security-Policy (see src/proxy.ts) whenever a
 * policy is violated. Log-only: one structured line to the Vercel logs (which
 * we already use for alerting), no persistence, and it never throws, so a
 * malformed or oversized report can neither break the browser nor the app.
 *
 * This is a report-only observability surface, not a state surface, so it needs
 * no auth. Oversized bodies are dropped to keep a spammer from flooding logs.
 */

const MAX_REPORT_BYTES = 8192;

export async function POST(request: Request) {
  try {
    const body = await request.text();
    if (body && body.length <= MAX_REPORT_BYTES) {
      console.warn('[csp-report]', body);
    }
  } catch {
    // Reporting must never fail the caller; swallow and acknowledge.
  }
  return new NextResponse(null, { status: 204 });
}
