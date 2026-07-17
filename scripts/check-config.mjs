/**
 * Validates vercel.json before it can reach Vercel.
 *
 * vercel.json is JSON — it has no comments — and Vercel validates it with
 * additionalProperties:false. A "//" comment key inside a headers[] entry is
 * therefore a hard build failure, which you otherwise only discover after a
 * push, from a dashboard this machine's CLI can't even read.
 *
 * Also refuses `immutable` on non-hashed asset URLs: these filenames are
 * stable, so immutable pins returning visitors to an old build for a year.
 */
import { readFileSync } from 'node:fs';

const fail = (msg) => { console.error(`  ✗ vercel.json: ${msg}`); process.exitCode = 1; };

let cfg;
try {
  cfg = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
} catch (e) {
  fail(`not valid JSON — ${e.message}`);
  process.exit(1);
}

const ROOT_KEYS = new Set([
  '$schema', 'buildCommand', 'outputDirectory', 'framework', 'cleanUrls',
  'trailingSlash', 'headers', 'redirects', 'rewrites', 'functions',
  'installCommand', 'devCommand', 'regions', 'crons', 'images', 'public'
]);
const HEADER_ENTRY_KEYS = new Set(['source', 'headers', 'has', 'missing']);
const REDIRECT_KEYS = new Set(['source', 'destination', 'permanent', 'statusCode', 'has', 'missing']);

for (const k of Object.keys(cfg)) {
  if (!ROOT_KEYS.has(k)) fail(`unknown top-level key "${k}"`);
}

for (const [i, entry] of (cfg.headers ?? []).entries()) {
  for (const k of Object.keys(entry)) {
    if (!HEADER_ENTRY_KEYS.has(k)) {
      fail(`headers[${i}] has key "${k}" — only ${[...HEADER_ENTRY_KEYS].join(', ')} are allowed (JSON has no comments)`);
    }
  }
  if (!entry.source || !entry.headers) fail(`headers[${i}] needs both "source" and "headers"`);

  for (const h of entry.headers ?? []) {
    if (h.key?.toLowerCase() === 'cache-control' && /immutable/i.test(h.value ?? '')) {
      if (!/\[hash\]|\$\{hash\}|\.[0-9a-f]{8}\./i.test(entry.source)) {
        fail(`headers[${i}] marks "${entry.source}" immutable, but the filenames are not content-hashed — returning visitors would be frozen on a stale build`);
      }
    }
  }
}

for (const [i, entry] of (cfg.redirects ?? []).entries()) {
  for (const k of Object.keys(entry)) {
    if (!REDIRECT_KEYS.has(k)) fail(`redirects[${i}] has unknown key "${k}"`);
  }
}

if (!process.exitCode) console.log('  ✓ vercel.json valid');
