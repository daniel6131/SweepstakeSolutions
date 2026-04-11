import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const WORLD_CUP_SEASON = '2026';
const endpoint = `https://api.football-data.org/v4/competitions/WC/matches?season=${WORLD_CUP_SEASON}`;

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

loadEnvFile(resolve(process.cwd(), '.env'));
loadEnvFile(resolve(process.cwd(), '.env.local'));

const token = process.env.FOOTBALL_DATA_API_KEY;
if (!token) {
  console.error('FOOTBALL_DATA_API_KEY is not set in .env or .env.local');
  process.exit(1);
}

const response = await fetch(endpoint, {
  headers: { 'X-Auth-Token': token },
});

const text = await response.text();

if (!response.ok) {
  console.error(`football-data.org returned ${response.status}`);
  console.error(text.slice(0, 2000));
  process.exit(1);
}

const payload = JSON.parse(text);
const matches = Array.isArray(payload.matches) ? payload.matches : [];
const stageCounts = new Map();
const statusCounts = new Map();

for (const match of matches) {
  stageCounts.set(match.stage, (stageCounts.get(match.stage) ?? 0) + 1);
  statusCounts.set(match.status, (statusCounts.get(match.status) ?? 0) + 1);
}

print(`endpoint: ${endpoint}`);
print(`status: ${response.status}`);
print(`requests-available: ${response.headers.get('x-requestsavailable') ?? 'n/a'}`);
print(`request-counter-reset: ${response.headers.get('x-requestcounter-reset') ?? 'n/a'}`);
print(`match-count: ${matches.length}`);
print(`stage-counts: ${JSON.stringify(Object.fromEntries(stageCounts))}`);
print(`status-counts: ${JSON.stringify(Object.fromEntries(statusCounts))}`);

for (const match of matches.slice(0, 5)) {
  print(
    [
      match.utcDate,
      match.stage,
      match.status,
      match.homeTeam?.shortName ?? match.homeTeam?.name,
      'vs',
      match.awayTeam?.shortName ?? match.awayTeam?.name,
      match.score?.fullTime?.home ?? '-',
      ':',
      match.score?.fullTime?.away ?? '-',
    ].join(' ')
  );
}
