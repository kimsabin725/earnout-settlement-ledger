// Drives docs/clause-check.html through every combination of its answers and
// compares each verdict with what the harness would say about the same clause.
//
// The page exists to tell a practitioner whether this model can hold their
// clause. A page that refuses a clause the model can hold does the opposite of
// its job: it tells someone to stop reading when they were the person to talk to.
//
// Run: node replay/rules.test.mjs
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { launch } from './browser.mjs';
import { check } from './rules.mjs';

const PAGE = 'file://' + path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../docs/clause-check.html');

// What a practitioner answering this way actually has. Where one answer could
// mean two different clauses, that ambiguity is a fault in the question, and the
// mapping says which reading it takes.
function clauseFor(a) {
  // "Once" is a single measurement period that has to be met — which is exactly
  // how Prosser v. PharmaLogic is written as a clause file.
  const periods = a.threshold === 'single-period' ? 1 : 4;
  const terms = {
    periodBasis: a.basis,
    metricTarget: 7_000_000,
    periods,
    payout: {
      type: a.payout,
      thresholdType: a.threshold === 'single-period' ? 'count-of-periods-met' : a.threshold,
      requiredPeriodsMet: periods,
      amount: 6_600_000,
    },
  };
  if (a.trigger === 'event') { terms.trigger = 'event'; terms.eventDescription = 'regulatory approval'; }
  if (a.moving === 'yes') terms.metricTargetsByPeriod = Array.from({ length: periods }, (_, i) => 7_000_000 + i * 1_000_000);
  if (a.metrics !== '1') terms.metrics = ['EBITDA', 'Revenue'];
  if (a.caps === 'yes') terms.caps = true;
  const schedule = Array.from({ length: periods }, (_, i) => ({ period: i + 1, metricValue: 8_000_000, oneOffOutflows: 0 }));
  return { id: 'Probe', terms, schedule };
}

const AXES = {
  trigger: ['metric', 'event'],
  payout: ['all-or-nothing', 'tiered', 'formula'],
  basis: ['per-period', 'cumulative'],
  moving: ['no', 'yes'],
  threshold: ['single-period', 'count-of-periods-met', 'other'],
  metrics: ['1', '2'],
  caps: ['no', 'yes'],
};
const combos = Object.entries(AXES).reduce(
  (acc, [k, vs]) => acc.flatMap((c) => vs.map((v) => ({ ...c, [k]: v }))), [{}]);

const b = await launch();
const p = await b.newPage();
await p.goto(PAGE);

let checked = 0;
const mismatches = [];
for (const a of combos) {
  await p.reload();
  for (const [k, v] of Object.entries(a)) await p.click(`input[name="${k}"][value="${v}"]`);
  await p.click('button[type=submit]');
  const pageSaysFits = (await p.textContent('.verdict')).trim().startsWith('COMPILES');
  const harnessSaysFits = check(clauseFor(a)).length === 0;
  checked++;
  if (pageSaysFits !== harnessSaysFits) {
    mismatches.push({ answers: a, page: pageSaysFits ? 'COMPILES' : 'REFUSED',
                      harness: harnessSaysFits ? 'expressible' : 'not expressible',
                      why: check(clauseFor(a)).map((r) => r.split('—')[0].trim()) });
  }
}
await b.close();

console.log(`${checked} combinations checked, ${mismatches.length} disagree with the harness`);
for (const m of mismatches.slice(0, 12)) {
  console.log(`  page ${m.page.padEnd(8)} harness ${m.harness.padEnd(16)} ${JSON.stringify(m.answers)}`);
  if (m.why.length) console.log(`      harness reasons: ${m.why.join(' | ')}`);
}
if (mismatches.length > 12) console.log(`  … and ${mismatches.length - 12} more`);
process.exit(mismatches.length ? 1 : 0);
