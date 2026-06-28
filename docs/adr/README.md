# Architecture Decision Records

Short records of the load-bearing decisions behind this app, so the "why" survives
even when the code changes. Each one is one page: Status, Context, Decision,
Consequences.

| #                                       | Decision                                              | Status   |
| --------------------------------------- | ----------------------------------------------------- | -------- |
| [0001](0001-vercel-kv-persistence.md)   | Vercel KV for draft + snapshot persistence            | Accepted |
| [0002](0002-canonical-snapshot.md)      | One canonical snapshot, lock-guarded, as the source   | Accepted |
| [0003](0003-degrade-to-static.md)       | Degrade to static + circuit-break on upstream failure | Accepted |
| [0004](0004-cookie-auth-fail-closed.md) | Shared-cookie auth that fails closed in production    | Accepted |

New decisions: copy the shape of an existing record, give it the next number, and
add a row above.
