import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';

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

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function usage() {
  print('Usage: node scripts/draft-smoke.mjs [status|complete|reset] [options]');
  print('');
  print('Commands:');
  print('  status     Read and summarise the current persisted draft state');
  print('  complete   Reset, run the full draft flow, and lock it');
  print('  reset      Reset the persisted draft state back to pending');
  print('');
  print('Options:');
  print('  --base-url=https://your-site.vercel.app   Target deployment or local app');
  print('  --json                                    Output machine-readable JSON');
  print('  --write                                   Required for complete/reset');
  print('  -h, --help                                Show help');
  print('');
  print('Env fallback order for base URL:');
  print('  DRAFT_API_BASE_URL -> NEXT_PUBLIC_BASE_URL -> http://localhost:3000');
}

function normalizeBaseUrl(url) {
  return url.replace(/\/+$/, '');
}

function buildSummary(state, baseUrl) {
  const assignmentsByPlayer = {};

  for (const assignment of Array.isArray(state.assignments) ? state.assignments : []) {
    assignmentsByPlayer[assignment.player] = (assignmentsByPlayer[assignment.player] ?? 0) + 1;
  }

  return {
    baseUrl,
    status: state.status,
    currentRound: state.currentRound,
    currentPick: state.currentPick,
    assignmentsCount: Array.isArray(state.assignments) ? state.assignments.length : 0,
    availableTeamsCount: Array.isArray(state.availableTeams) ? state.availableTeams.length : 0,
    playerOrderCount: Array.isArray(state.playerOrder) ? state.playerOrder.length : 0,
    conflictCount: Array.isArray(state.conflicts) ? state.conflicts.length : 0,
    lockedAssignmentsReady:
      state.status === 'locked' &&
      Array.isArray(state.assignments) &&
      state.assignments.length === 48 &&
      Array.isArray(state.availableTeams) &&
      state.availableTeams.length === 0,
    assignmentsByPlayer,
  };
}

function printSummary(summary) {
  print(`base-url: ${summary.baseUrl}`);
  print(`status: ${summary.status}`);
  print(`current-round: ${summary.currentRound}`);
  print(`current-pick: ${summary.currentPick}`);
  print(`assignments: ${summary.assignmentsCount}`);
  print(`available-teams: ${summary.availableTeamsCount}`);
  print(`player-order-count: ${summary.playerOrderCount}`);
  print(`conflicts: ${summary.conflictCount}`);
  print(`locked-assignments-ready: ${summary.lockedAssignmentsReady ? 'yes' : 'no'}`);
  print(`per-player-counts: ${JSON.stringify(summary.assignmentsByPlayer)}`);
}

async function requestJson(baseUrl, method, body) {
  const response = await fetch(`${baseUrl}/api/draft`, {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let payload;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  if (!response.ok) {
    const errorMessage =
      payload && typeof payload === 'object' && 'error' in payload
        ? payload.error
        : `${response.status} ${response.statusText}`;
    throw new Error(`Draft API request failed: ${errorMessage}`);
  }

  return payload;
}

loadEnvFile(resolve(process.cwd(), '.env'));
loadEnvFile(resolve(process.cwd(), '.env.local'));

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    'base-url': { type: 'string' },
    help: { type: 'boolean', short: 'h' },
    json: { type: 'boolean' },
    write: { type: 'boolean' },
  },
});

const command = positionals[0] ?? 'status';

if (values.help || !['status', 'complete', 'reset'].includes(command)) {
  usage();
  process.exit(values.help ? 0 : 1);
}

const baseUrl = normalizeBaseUrl(
  values['base-url'] ??
    process.env.DRAFT_API_BASE_URL ??
    process.env.NEXT_PUBLIC_BASE_URL ??
    'http://localhost:3000'
);

if ((command === 'complete' || command === 'reset') && !values.write) {
  console.error(
    `'${command}' mutates persisted state. Re-run with --write if that is intentional.`
  );
  process.exit(1);
}

if (command === 'status') {
  const state = await requestJson(baseUrl, 'GET');
  const summary = buildSummary(state, baseUrl);

  if (values.json) {
    print(JSON.stringify({ summary, state }, null, 2));
  } else {
    printSummary(summary);
  }

  process.exit(0);
}

if (command === 'reset') {
  const state = await requestJson(baseUrl, 'POST', { action: 'reset' });
  const summary = buildSummary(state, baseUrl);

  if (values.json) {
    print(JSON.stringify({ summary, state }, null, 2));
  } else {
    print('Draft state reset.');
    printSummary(summary);
  }

  process.exit(0);
}

print('Resetting draft state before smoke run...');
await requestJson(baseUrl, 'POST', { action: 'reset' });

print('Starting draft...');
let state = await requestJson(baseUrl, 'POST', { action: 'start' });
let drawCount = 0;

while (state.status === 'drafting') {
  const nextState = await requestJson(baseUrl, 'POST', { action: 'draw' });
  state = nextState;
  drawCount += 1;

  if (drawCount > 48) {
    throw new Error('Smoke run exceeded 48 draws. Aborting.');
  }
}

if (state.status !== 'trading') {
  throw new Error(`Expected trading phase after draws, received '${state.status}'.`);
}

print(`Drafted ${drawCount} teams. Locking draft...`);
await requestJson(baseUrl, 'POST', { action: 'lock' });

const finalState = await requestJson(baseUrl, 'GET');
const summary = buildSummary(finalState, baseUrl);

if (!summary.lockedAssignmentsReady) {
  throw new Error(
    'Draft smoke run completed, but persisted state is not fully locked with 48 assignments.'
  );
}

if (values.json) {
  print(JSON.stringify({ summary, state: finalState }, null, 2));
} else {
  print('Draft smoke run passed.');
  printSummary(summary);
}
