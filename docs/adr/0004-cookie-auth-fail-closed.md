# 0004 - Shared-cookie auth that fails closed in production

Status: Accepted

## Context

Two surfaces are privileged: the `/draft` ceremony (run once by the organiser)
and `/dev-console` (manual score overrides). There are no end-user accounts: 12
participants are hardcoded, so a full auth provider, user table, and session
store would be overkill. But the surfaces mutate shared state, the repo is
public, and an earlier version protected only the page UI while leaving the
`/api/draft` mutation route wide open.

## Decision

Gate both surfaces with a single shared secret per surface (`DRAFT_SECRET`,
`DEV_CONSOLE_PASSWORD`), held server-side only.

- The login server action validates the password (constant-time compare of
  SHA-256 hashes) and sets an `httpOnly`, `Secure`-in-prod, `SameSite=Lax`
  cookie scoped to `/`, so it reaches the API route, not just the page.
- The state-mutating `/api/draft` route validates the cookie on every verb,
  rate-limits per IP, validates the request body, and writes an audit entry.
- Auth fails CLOSED in production: if the secret is unset, access is denied
  (it stays open in local dev for convenience).

## Consequences

- Proportionate to a friend-group app: no account system to build or operate.
- The cookie is a static shared bearer (the secret's hash), replayable for its
  12h/8h lifetime, with no per-session rotation or server-side revocation. This
  is an accepted trade-off for a trusted, run-once organiser surface; a future
  upgrade would issue a signed, expiring session token.
- A forgotten env var in production locks the surface down rather than exposing
  it, which is the safe failure mode.
- Classic per-user concerns (IDOR, password reset, JWT `alg:none`, multi-tenant
  isolation) are not applicable: there is no per-user data.
