// Fails if a number appears in our prose with nothing nearby saying where it
// came from.
//
// The credibility of these documents rests on a habit — every figure is either
// sourced, computed here, or explicitly not claimed. A single unsourced
// percentage undoes more than it adds, and they arrive quietly: a statistic
// picked up while reading, repeated once, then repeated as ours.
//
// "Nearby" means the same paragraph. A source is a citation, a link, a file
// this repository contains, a hedge that disclaims the figure, or a marker
// saying the number was computed by the harness.
//
// Run: node tools/check-claims.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// The script is read aloud, so a figure that drifts there is harder to take back
// than one in a document nobody reads twice.
const FILES = ['README.md', 'docs/validation.md', 'docs/demo-script-s3.md'];

// A figure that asserts something about the world, rather than describing this
// repository's own output.
const CLAIM = new RegExp([
  String.raw`\b\d{1,3}(?:\.\d+)?\s?%`,                       // 28%
  String.raw`\bUS?\$\s?[\d,.]+\s?(?:m|bn|billion|million)?\b`, // $6.6m
  String.raw`\$[\d,]{4,}`,                                      // $7,000,000
  String.raw`\b\d+\s+(?:of|in)\s+\d+\b`,                      // 2 of 9
  // Spoken figures. A script is read aloud, so "six point six million" is a
  // claim in exactly the way "$6.6m" is, and the digit patterns above walk
  // straight past it.
  String.raw`\b(?:one|two|three|four|five|six|seven|eight|nine|ten|twenty|thirty|hundred|thousand)[\w\s-]{0,24}?(?:percent|million|billion)\b`,
].join('|'), 'i');

const SOURCED = [
  /\(([^)]*\b(19|20)\d\d\b[^)]*)\)/,          // (Some Study, 2024)
  /https?:\/\//,                               // a link
  /\b(ABA|SRS Acquiom|Kroll|Jones Day|Mayer Brown|Potter Anderson|Del\.|Chancery|Super\.)/,
  /`[^`]+\.(md|mjs|json|sol|daml|yaml|html)`/, // a file in this repo
  /\b(sha256|package id|commit)\b/i,           // something checkable here
  /\b(not measured|do not claim|no figures|not disclosed|not in the source|SYNTHETIC|invented|hypothesis)\b/i,
  /\[source:[^\]]+\]/i,   // a recording note, carried beside a spoken figure and not read out
  /\b(this model pays|the harness|replayed|computed here|reference arithmetic)\b/i,
];

let bad = 0;
for (const rel of FILES) {
  const text = fs.readFileSync(path.join(root, rel), 'utf8');
  // Paragraphs, but a markdown table row stands alone: each row is its own claim.
  const blocks = text.split(/\n\s*\n/).flatMap((b) => (b.trimStart().startsWith('|') ? b.split('\n') : [b]));
  for (const [i, block] of blocks.entries()) {
    if (!CLAIM.test(block)) continue;
    if (SOURCED.some((r) => r.test(block))) continue;
    // A note sitting immediately under the passage counts. In the video script
    // the figures are spoken and the sourcing is a line the microphone never
    // sees, so it cannot live inside the sentence it vouches for.
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
