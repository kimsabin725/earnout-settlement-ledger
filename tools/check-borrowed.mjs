// Fails if our prose shares a run of words with something we read.
//
// Written after three sentences turned up paraphrased from a previous season's
// winning submission. A list of phrases I remembered borrowing found none of
// them; this found all three, including one I had kept because it read like a
// plain description of Canton.
//
// A hit is not automatically plagiarism — a deal's terms have only so many ways
// of being stated. It is a place to look, and the reviewer decides. Facts that
// must be phrased a certain way go in ALLOW with the reason.
//
// Run: node tools/check-borrowed.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fingerprints, words, N } from './fingerprint.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Prose a judge reads. Code and generated files are excluded: replay.html is
// built from the clause files, so a hit there belongs to the clause file.
const FILES = [
  'README.md',
  'docs/validation.md',
  'docs/clause-check.html',
  ...fs.readdirSync(path.join(root, 'replay/clauses')).filter((f) => f.endsWith('.json')).map((f) => `replay/clauses/${f}`),
];

// Shared wording that is a fact about a deal rather than a way of writing.
const ALLOW = [
  'to sales and net revenue milestones',        // Fortis v. Medtronic's terms
  'tied to sales and net revenue',              //   "
  'two commercial and eight regulatory',        // Fortis v. J&J's terms
  'commercial and eight regulatory milestones', //   "
  'up to 2 35 billion in additional consideration',  // the Auris figure
];

const corpus = JSON.parse(fs.readFileSync(path.join(root, 'tools/borrowed.json'), 'utf8'));
const index = new Map();
for (const src of corpus) for (const h of src.hashes) index.set(h, src.label);

// An allowed phrase covers every window inside it, not just its first — the
// normaliser splits "$2.35bn" into two tokens, so the window that matches is
// rarely the one the phrase starts with.
const allowed = new Set();
for (const a of ALLOW) for (const h of fingerprints(a)) allowed.add(h);

let hits = 0;
for (const rel of FILES) {
  const text = fs.readFileSync(path.join(root, rel), 'utf8');
  const w = words(text);
  const seen = new Set();
  for (let i = 0; i + N <= w.length; i++) {
    const gram = w.slice(i, i + N).join(' ');
    const [h] = fingerprints(gram);
    if (!index.has(h) || allowed.has(h) || seen.has(gram)) continue;
    seen.add(gram);
    hits++;
    console.log(`  ${rel}`);
    console.log(`    "${gram}"  ← also in: ${index.get(h)}`);
  }
}

if (hits) {
  console.log(`\n${hits} run${hits > 1 ? 's' : ''} of ${N} words shared with something we read.`);
  console.log('Rewrite it in our own terms, or add it to ALLOW with the reason it can only be said that way.');
  process.exit(1);
}
console.log(`no ${N}-word run in our prose is shared with anything in tools/borrowed.json`);
