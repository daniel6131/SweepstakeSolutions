/**
 * Lightweight load / stress test for the live read path.
 *
 * Fires N concurrent GETs at `/api/live` and reports the status mix and latency.
 * The football-data.org budget (10 req/min on the free tier) is protected by the
 * KV refresh lock in `refresh-snapshot.ts`, NOT by raw request count, so under
 * load you should see ~all 200s and the upstream fetch count should stay flat.
 *
 * While this runs, watch the deployment logs for the distinct rate-limit signal:
 *   [football-api] RATE_LIMIT_429
 * If that line does not appear under load, the lock is coalescing reads as
 * intended and the 10 req/min budget is safe.
 *
 * Usage:
 *   node scripts/load-test.mjs --url=https://<deployment> --requests=200 --concurrency=50
 *   npm run load-test -- --url=https://<deployment> --requests=200 --concurrency=50
 */

import { parseArgs } from 'node:util';

function print(line = '') {
  process.stdout.write(`${line}\n`);
}

const { values } = parseArgs({
  options: {
    url: { type: 'string' },
    path: { type: 'string', default: '/api/live' },
    requests: { type: 'string', default: '200' },
    concurrency: { type: 'string', default: '50' },
    help: { type: 'boolean', short: 'h', default: false },
  },
});

if (values.help || !values.url) {
  print(
    'Usage: node scripts/load-test.mjs --url=https://<deployment> [--path=/api/live] [--requests=200] [--concurrency=50]'
  );
  process.exit(values.help ? 0 : 1);
}

const base = values.url.replace(/\/+$/, '');
const target = `${base}${values.path}`;
const total = Number(values.requests);
const concurrency = Number(values.concurrency);

const latencies = [];
const statusCounts = new Map();
let issued = 0;
let failures = 0;

async function worker() {
  while (issued < total) {
    issued += 1;
    const start = performance.now();
    try {
      const res = await fetch(target, { headers: { 'cache-control': 'no-cache' } });
      latencies.push(performance.now() - start);
      statusCounts.set(res.status, (statusCounts.get(res.status) ?? 0) + 1);
    } catch (error) {
      failures += 1;
      print(`request error: ${error.message}`);
    }
  }
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const index = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[index];
}

async function main() {
  print(`Load test: ${total} requests, ${concurrency} concurrent, target ${target}`);
  const startedAt = performance.now();
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  const elapsedMs = performance.now() - startedAt;

  const sorted = [...latencies].sort((a, b) => a - b);
  print('');
  print(
    `Completed ${latencies.length} responses in ${(elapsedMs / 1000).toFixed(1)}s (${failures} transport failures)`
  );
  print(`Throughput: ${(latencies.length / (elapsedMs / 1000)).toFixed(1)} req/s`);
  print(
    `Latency  p50 ${percentile(sorted, 50).toFixed(0)}ms  p95 ${percentile(sorted, 95).toFixed(0)}ms  p99 ${percentile(sorted, 99).toFixed(0)}ms`
  );
  print('Status mix:');
  for (const [status, count] of [...statusCounts.entries()].sort()) {
    print(`  ${status}: ${count}`);
  }
  print('');
  print(
    'Now check the deployment logs: a healthy run shows few/no [football-api] RATE_LIMIT_429 lines.'
  );
}

main().catch((error) => {
  print(`Error: ${error.message}`);
  process.exit(1);
});
