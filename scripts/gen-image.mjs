/**
 * Image generator for art-directed reference imagery — free, no billing.
 *
 * Providers:
 *   pollinations (default) — FLUX via image.pollinations.ai. No key, no signup, $0.
 *   cloudflare             — FLUX.1-schnell via Cloudflare Workers AI free tier.
 *                            Needs CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_API_TOKEN.
 *   gemini                 — gemini-2.5-flash-image. NOTE: Gemini image gen has NO
 *                            free API tier (returns quota 0); requires billing.
 *
 * Usage:
 *   node scripts/gen-image.mjs --prompt "..." [--out path.png] [--aspect 16:9]
 *                              [--provider pollinations|cloudflare|gemini] [--seed 7]
 *
 * Keys live in .env.local (gitignored). See .env.local.example.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { parseArgs } from 'node:util';

const ASPECT_DIMS = {
  '1:1': [1024, 1024],
  '16:9': [1920, 1080],
  '9:16': [1080, 1920],
  '3:2': [1536, 1024],
  '2:3': [1024, 1536],
  '4:3': [1365, 1024],
  '3:4': [1024, 1365],
  '4:5': [1024, 1280],
  '5:4': [1280, 1024],
  '21:9': [1920, 823],
};

function print(line = '') {
  process.stdout.write(`${line}\n`);
}

// Mirror of the loader in draft-smoke.mjs — no extra dependency.
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
  print('Usage: node scripts/gen-image.mjs --prompt "..." [options]');
  print('');
  print('Options:');
  print('  --prompt="..."        Image description (required)');
  print('  --out=path.png        Output file (default: references/gen-<slug>-<ts>.png)');
  print('  --aspect=16:9         1:1 16:9 9:16 3:2 2:3 4:3 3:4 4:5 5:4 21:9 (default 1:1)');
  print('  --provider=name       pollinations (default) | cloudflare | gemini');
  print('  --seed=N              Reproducible result (pollinations/cloudflare)');
  print('  -h, --help            Show help');
  print('');
  print('pollinations: no key needed. cloudflare: CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_API_TOKEN.');
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

function dims(aspect) {
  return ASPECT_DIMS[aspect || '1:1'] || ASPECT_DIMS['1:1'];
}

async function viaPollinations({ prompt, aspect, seed }) {
  const [width, height] = dims(aspect);
  const params = new URLSearchParams({
    width: String(width),
    height: String(height),
    model: 'flux',
    nologo: 'true',
    private: 'true',
  });
  if (seed != null) params.set('seed', String(seed));
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${params}`;
  const res = await fetch(url);
  if (!res.ok)
    throw new Error(`Pollinations HTTP ${res.status}: ${(await res.text()).slice(0, 160)}`);
  return Buffer.from(await res.arrayBuffer());
}

async function viaCloudflare({ prompt, seed }) {
  const account = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!account || !token) {
    throw new Error(
      'Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in .env.local for the cloudflare provider.'
    );
  }
  const url = `https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/@cf/black-forest-labs/flux-1-schnell`;
  const body = { prompt };
  if (seed != null) body.seed = Number(seed);
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok || !json?.result?.image) {
    throw new Error(`Cloudflare error: ${JSON.stringify(json?.errors || json).slice(0, 200)}`);
  }
  return Buffer.from(json.result.image, 'base64');
}

async function viaGemini({ prompt, aspect }) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set.');
  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey });
  const request = { model: 'gemini-2.5-flash-image', contents: prompt };
  if (aspect) request.config = { imageConfig: { aspectRatio: aspect } };
  const response = await ai.models.generateContent(request);
  const parts = response?.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    if (part.inlineData?.data) return Buffer.from(part.inlineData.data, 'base64');
  }
  throw new Error('No image returned (Gemini image gen requires billing — free tier quota is 0).');
}

const PROVIDERS = { pollinations: viaPollinations, cloudflare: viaCloudflare, gemini: viaGemini };

async function main() {
  loadEnvFile(resolve(process.cwd(), '.env.local'));

  const { values } = parseArgs({
    options: {
      prompt: { type: 'string' },
      out: { type: 'string' },
      aspect: { type: 'string' },
      provider: { type: 'string', default: 'pollinations' },
      seed: { type: 'string' },
      help: { type: 'boolean', short: 'h', default: false },
    },
  });

  if (values.help || !values.prompt) {
    usage();
    process.exit(values.help ? 0 : 1);
  }

  const generate = PROVIDERS[values.provider];
  if (!generate) {
    print(`Unknown provider "${values.provider}". Use: ${Object.keys(PROVIDERS).join(', ')}`);
    process.exit(1);
  }

  const out = resolve(
    process.cwd(),
    values.out || `references/gen-${slugify(values.prompt)}-${Date.now()}.png`
  );

  print(`Generating via ${values.provider}${values.aspect ? ` (${values.aspect})` : ''}…`);

  let buffer;
  try {
    buffer = await generate({ prompt: values.prompt, aspect: values.aspect, seed: values.seed });
  } catch (error) {
    print(`Error: ${error?.message || error}`);
    process.exit(1);
  }

  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, buffer);
  print(`Saved: ${out} (${(buffer.length / 1024).toFixed(0)} KB)`);
}

main().catch((error) => {
  print(`Unexpected error: ${error?.message || error}`);
  process.exit(1);
});
