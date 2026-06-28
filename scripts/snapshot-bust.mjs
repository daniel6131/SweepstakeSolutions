/**
 * Force a snapshot refresh by deleting the canonical KV snapshot. The next read
 * (home page or /api/live) recomputes it from upstream. Use when a score is
 * wrong and you do not want to wait for the snapshot to age out.
 *
 * Usage: npm run snapshot:bust
 * Reads KV_REST_API_URL / KV_REST_API_TOKEN from the environment or .env.local.
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SNAPSHOT_KEY = 'sweepstake:snapshot';

function print(line = '') {
  process.stdout.write(`${line}\n`);
}

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

async function main() {
  loadEnvFile(resolve(process.cwd(), '.env.local'));

  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    print(
      'KV is not configured. Set KV_REST_API_URL and KV_REST_API_TOKEN (or add them to .env.local).'
    );
    process.exit(1);
  }

  const { kv } = await import('@vercel/kv');
  await kv.del(SNAPSHOT_KEY);
  print(`Deleted ${SNAPSHOT_KEY}. The next read will recompute from upstream.`);
}

main().catch((error) => {
  print(`Error: ${error.message}`);
  process.exit(1);
});
