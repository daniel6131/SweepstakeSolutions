/**
 * Draft backup / restore utility.
 *
 * The locked draft (who owns which teams) lives in a single mutable Vercel KV
 * key (`draft:state`). `lockDraft()` also writes an immutable copy to
 * `draft:locked:<timestamp>` plus a `draft:locked:latest` pointer. This script
 * lets the organiser list those backups, snapshot the current state on demand,
 * and restore one if `draft:state` is ever wiped (e.g. an accidental reset).
 *
 * Usage:
 *   node scripts/draft-backup.mjs list                 List backup keys
 *   node scripts/draft-backup.mjs save                 Snapshot draft:state -> a new backup key
 *   node scripts/draft-backup.mjs export [key]         Print a backup as JSON (default: latest)
 *   node scripts/draft-backup.mjs restore [key] --write  Copy a backup into draft:state
 *
 * Reads KV_REST_API_URL / KV_REST_API_TOKEN from the environment or .env.local.
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const KV_KEY = 'draft:state';
const LOCK_BACKUP_PREFIX = 'draft:locked:';

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

function usage() {
  print('Usage: node scripts/draft-backup.mjs <list|save|export|restore> [key] [--write]');
  print('');
  print('  list                 List backup keys (newest first)');
  print('  save                 Snapshot draft:state into a new draft:locked:<ts> backup');
  print('  export [key]         Print a backup as JSON (default: draft:locked:latest)');
  print('  restore [key] --write  Copy a backup into draft:state (requires --write)');
}

async function getKv() {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    print(
      'KV is not configured. Set KV_REST_API_URL and KV_REST_API_TOKEN (or add them to .env.local).'
    );
    process.exit(1);
  }
  const { kv } = await import('@vercel/kv');
  return kv;
}

async function main() {
  loadEnvFile(resolve(process.cwd(), '.env.local'));

  const [command, maybeKey] = process.argv.slice(2);
  const write = process.argv.includes('--write');

  if (!command || command === '-h' || command === '--help') {
    usage();
    return;
  }

  const kv = await getKv();

  if (command === 'list') {
    const keys = [];
    for await (const key of kv.scanIterator({ match: `${LOCK_BACKUP_PREFIX}*` })) keys.push(key);
    keys.sort().reverse();
    if (keys.length === 0) {
      print('No backups found. A backup is written automatically when the draft is locked.');
      return;
    }
    keys.forEach((k) => print(k));
    return;
  }

  if (command === 'save') {
    const state = await kv.get(KV_KEY);
    if (!state) {
      print('Nothing to back up: draft:state is empty.');
      process.exit(1);
    }
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const key = `${LOCK_BACKUP_PREFIX}${stamp}`;
    await kv.set(key, state);
    await kv.set(`${LOCK_BACKUP_PREFIX}latest`, state);
    print(`Saved backup: ${key}`);
    return;
  }

  if (command === 'export') {
    const key = maybeKey && maybeKey !== '--write' ? maybeKey : `${LOCK_BACKUP_PREFIX}latest`;
    const state = await kv.get(key);
    if (!state) {
      print(`No backup at ${key}`);
      process.exit(1);
    }
    print(JSON.stringify(state, null, 2));
    return;
  }

  if (command === 'restore') {
    const key = maybeKey && maybeKey !== '--write' ? maybeKey : `${LOCK_BACKUP_PREFIX}latest`;
    const state = await kv.get(key);
    if (!state) {
      print(`No backup at ${key}`);
      process.exit(1);
    }
    if (!write) {
      print(
        `Dry run. Would restore ${key} -> ${KV_KEY} (status: ${state.status}, ${(state.assignments || []).length} assignments).`
      );
      print('Re-run with --write to apply.');
      return;
    }
    await kv.set(KV_KEY, state);
    print(`Restored ${key} -> ${KV_KEY}.`);
    return;
  }

  usage();
  process.exit(1);
}

main().catch((error) => {
  print(`Error: ${error.message}`);
  process.exit(1);
});
