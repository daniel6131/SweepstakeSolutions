/**
 * Append-only audit trail for security-relevant events (draft mutations and auth
 * decisions). Kept as a capped list in KV so we never grow it unbounded.
 *
 * Best-effort by design: a logging failure must never break the action it's
 * recording, so everything is wrapped and we always echo to stdout too (Vercel
 * captures that even when KV is unavailable).
 */

import { getKv, isKVEnabled } from '@/lib/kv';

const AUDIT_KEY = 'audit:log';
const MAX_ENTRIES = 500;

export type AuditCategory = 'draft' | 'auth';

export type AuditEntry = {
  ts: string; // ISO timestamp
  category: AuditCategory;
  action: string;
  actor: string; // client IP, or 'system'
  detail?: string;
};

export async function recordAudit(entry: Omit<AuditEntry, 'ts'>): Promise<void> {
  const line: AuditEntry = { ts: new Date().toISOString(), ...entry };
  const suffix = line.detail ? ` ${line.detail}` : '';
  // The audit trail must always emit, even when KV is unavailable, so this log
  // is intentional (and info-level, since it's a record, not a problem).
  // eslint-disable-next-line no-console
  console.info(`[audit] ${line.category} ${line.action} actor=${line.actor}${suffix}`);

  if (!isKVEnabled()) return;
  try {
    const kv = await getKv();
    await kv.lpush(AUDIT_KEY, JSON.stringify(line));
    await kv.ltrim(AUDIT_KEY, 0, MAX_ENTRIES - 1);
  } catch (err) {
    console.error('[audit] failed to persist entry:', err);
  }
}

/** Read the most recent entries, newest first. Empty when KV is unavailable. */
export async function readAudit(limit = 100): Promise<AuditEntry[]> {
  if (!isKVEnabled()) return [];
  try {
    const kv = await getKv();
    const raw = await kv.lrange(AUDIT_KEY, 0, limit - 1);
    return raw.map((r) =>
      typeof r === 'string' ? (JSON.parse(r) as AuditEntry) : (r as AuditEntry)
    );
  } catch {
    return [];
  }
}
