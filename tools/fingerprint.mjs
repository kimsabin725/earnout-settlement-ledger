// Hashed n-grams of a source text, so the repo stores no one else's words.
// Usage: node tools/fingerprint.mjs <label> <file...>  >> tools/borrowed.json
import fs from 'node:fs';
import crypto from 'node:crypto';

export const N = 5;

export function words(text) {
  return text
    .replace(/<[^>]+>/g, ' ')
    .replace(/[^A-Za-z0-9 ]/g, ' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
}

export function fingerprints(text, n = N) {
  const w = words(text);
  const out = new Set();
  for (let i = 0; i + n <= w.length; i++) {
    out.add(crypto.createHash('sha256').update(w.slice(i, i + n).join(' ')).digest('hex').slice(0, 16));
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , label, ...files] = process.argv;
  const all = new Set();
  for (const f of files) for (const h of fingerprints(fs.readFileSync(f, 'utf8'))) all.add(h);
  console.log(JSON.stringify({ label, n: N, hashes: [...all].sort() }));
}
