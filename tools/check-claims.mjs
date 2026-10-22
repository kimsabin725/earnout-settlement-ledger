// Fails if a figure in our prose has no source, computation or disclaimer in the same paragraph.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILES = ['README.md', 'docs/validation.md', 'docs/demo-script-s3.md'];

const CLAIM = new RegExp([
  String.raw`\b\d{1,3}(?:\.\d+)?\s?%`,
  String.raw`\bUS?\$\s?[\d,.]+\s?(?:m|bn|billion|million)?\b`,
  String.raw`\$[\d,]{4,}`,
  String.raw`\b\d+\s+(?:of|in)\s+\d+\b`,
  // spoken figures in the video script, e.g. "six point six million"
  String.raw`\b(?:one|two|three|four|five|six|seven|eight|nine|ten|twenty|thirty|hundred|thousand)[\w\s-]{0,24}?(?:percent|million|billion)\b`,
].join('|'), 'i');

const SOURCED = [
  /\(([^)]*\b(19|20)\d\d\b[^)]*)\)/,
  /https?:\/\//,
  /\b(ABA|SRS Acquiom|Kroll|Jones Day|Mayer Brown|Potter Anderson|Del\.|Chancery|Super\.)/,
  /`[^`]+\.(md|mjs|json|sol|daml|yaml|html)`/,
  /\b(sha256|package id|commit)\b/i,
  /\b(not measured|do not claim|no figures|not disclosed|not in the source|SYNTHETIC|invented|hypothesis)\b/i,
  /\[source:[^\]]+\]/i,
  /\b(this model pays|the harness|replayed|computed here|reference arithmetic)\b/i,
];

let bad = 0;
for (const rel of FILES) {
  const text = fs.readFileSync(path.join(root, rel), 'utf8');
  const blocks = text.split(/\n\s*\n/).flatMap((b) => (b.trimStart().startsWith('|') ? b.split('\n') : [b]));
  for (const [i, block] of blocks.entries()) {
    if (!CLAIM.test(block)) continue;
    if (SOURCED.some((r) => r.test(block))) continue;
    // spoken figures are sourced by a [source: …] note on the next line
    const next = blocks[i + 1] ?? '';
    if (/^\s*`?\[source:/i.test(next)) continue;
    bad++;
    const line = block.trim().split('\n')[0].slice(0, 120);
    console.log(`  ${rel}\n    ${line}${block.length > 120 ? '…' : ''}`);
  }
}

if (bad) {
  console.log(`\n${bad} passage${bad > 1 ? 's' : ''} carry a figure with no source in the same paragraph.`);
  console.log('Name where it came from, say it was computed here, or say plainly that it is not claimed.');
  process.exit(1);
}
console.log('every figure in the prose has a source, a computation, or a disclaimer beside it');
