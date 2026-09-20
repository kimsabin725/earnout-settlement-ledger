// Does the page route a real clause the way the harness does?
//
// rules.test.mjs checks that the page agrees with the harness about a clause I
// described. This checks the harder thing: that a practitioner holding a known
// clause, answering honestly, lands where the harness lands. The gap between
// those two is the page's actual job — translating what someone has into what
// the model can hold — and it is where the page can be wrong while agreeing
// with itself.
//
// Run: node replay/page.test.mjs
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { launch } from './browser.mjs';

const PAGE = 'file://' + path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../docs/clause-check.html');

// Each fixture is a clause someone really holds, the answers an honest reader
// would give, and what the harness says about that clause when it is written
// as a clause file.
const FIXTURES = [
  {
    name: 'Prosser v. PharmaLogic — one measurement period, EBITDA cliff (the one real clause that replays)',
    answers: { trigger: 'metric', payout: 'all-or-nothing', basis: 'per-period', moving: 'no',
               threshold: 'single-period', metrics: '1', caps: 'no' },
    expect: 'COMPILES',
  },
  {
    name: 'The native shape — three of four quarters must hit the target',
    answers: { trigger: 'metric', payout: 'all-or-nothing', basis: 'per-period', moving: 'no',
               threshold: 'count-of-periods-met', metrics: '1', caps: 'no' },
    expect: 'COMPILES',
  },
  {
    name: 'A plain cliff written as "up to $6.6m" — the amount is the tranche, not a cap',
    answers: { trigger: 'metric', payout: 'all-or-nothing', basis: 'per-period', moving: 'no',
               threshold: 'single-period', metrics: '1', caps: 'no' },
    expect: 'COMPILES',
  },
  {
    name: 'Lazard v. QinetiQ — "up to $40m", tiered',
    answers: { trigger: 'metric', payout: 'tiered', basis: 'per-period', moving: 'no',
               threshold: 'count-of-periods-met', metrics: '1', caps: 'no' },
    expect: 'REFUSED',
  },
  {
    name: 'Fortis v. J&J (Auris) — FDA regulatory milestones',
    answers: { trigger: 'event', payout: 'all-or-nothing', basis: 'per-period', moving: 'no',
               threshold: 'count-of-periods-met', metrics: '1', caps: 'no' },
    expect: 'REFUSED',
  },
  {
    name: 'Winshall v. Viacom — 3.5x the excess over a threshold that rises',
    answers: { trigger: 'metric', payout: 'formula', basis: 'per-period', moving: 'yes',
               threshold: 'count-of-periods-met', metrics: '1', caps: 'no' },
    expect: 'REFUSED',
  },
  {
    name: 'In re SwervePay — pro-rated against a baseline',
    answers: { trigger: 'metric', payout: 'formula', basis: 'per-period', moving: 'no',
               threshold: 'other', metrics: '1', caps: 'no' },
    expect: 'REFUSED',
  },
  {
    name: 'Cumulative earnout — a strong year four carries a weak year two',
    answers: { trigger: 'metric', payout: 'all-or-nothing', basis: 'cumulative', moving: 'no',
               threshold: 'count-of-periods-met', metrics: '1', caps: 'no' },
    expect: 'REFUSED',
  },
];

const b = await launch();
const p = await b.newPage();
await p.goto(PAGE);
let failed = 0;
for (const f of FIXTURES) {
  await p.reload();
  for (const [k, v] of Object.entries(f.answers)) {
    const sel = `input[name="${k}"][value="${v}"]`;
    if (!(await p.locator(sel).count())) { console.log(`  MISSING OPTION  ${k}=${v}  (${f.name})`); failed++; continue; }
    await p.click(sel);
  }
  await p.click('button[type=submit]');
  const verdict = (await p.textContent('.verdict')).trim();
  const got = verdict.startsWith('COMPILES') ? 'COMPILES' : 'REFUSED';
  const ok = got === f.expect;
  if (!ok) failed++;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${f.expect.padEnd(8)} got ${got.padEnd(8)} ${f.name}`);
  if (!ok) console.log(`          verdict line: ${verdict}`);
}
await b.close();
console.log(`\n${FIXTURES.length} real clause shapes, ${failed} routed wrongly`);
process.exit(failed ? 1 : 0);
