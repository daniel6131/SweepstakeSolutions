/**
 * Thin Vercel KV accessors.
 *
 * `getReadKv` uses the read-only token when one is configured, so the hot read
 * paths (snapshot, draft state) run with least privilege and can't accidentally
 * write. It falls back to the read/write client when no RO token is set, so CI
 * and local dev keep working. Everything is imported lazily so non-KV setups
 * never pull in the SDK.
 */

export const isKVEnabled = (): boolean => Boolean(process.env.KV_REST_API_URL);

export async function getKv() {
  const { kv } = await import('@vercel/kv');
  return kv;
}

export async function getReadKv() {
  const url = process.env.KV_REST_API_URL;
  const roToken = process.env.KV_REST_API_READ_ONLY_TOKEN?.trim();
  if (url && roToken) {
    const { createClient } = await import('@vercel/kv');
    return createClient({ url, token: roToken });
  }
  return getKv();
}
