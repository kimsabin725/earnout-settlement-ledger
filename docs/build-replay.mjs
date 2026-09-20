// Builds docs/replay.html from the clause files themselves.
//
// The central claim in docs/validation.md is that a clause nobody here wrote
// replays to the payout the parties actually settled on. That claim currently
// lives in a markdown table. This makes it something a judge can click through
// period by period — and because the page is generated from the same clause
// files and the same rules the harness uses, it cannot drift into saying
// something the harness does not.
//
// Run: node docs/build-replay.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { check, evaluate } from '../replay/rules.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(here, '../replay/clauses');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json') && f !== 'template.json').sort();

const clauses = files.map((f) => {
  const c = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  const reasons = check(c);
  return { ...c, reasons, ev: reasons.length ? null : evaluate(c) };
});

const money = (n) => '$' + Number(n).toLocaleString('en-US');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function periodRows(c) {
  return c.ev.verdicts.map((v) => {
    const state = v.dispute
      ? (v.effectiveMet ? 'disputed → arbiter allowed it' : 'disputed → arbiter upheld the miss')
      : v.met ? 'met' : v.flagged ? 'missed, flagged — one-off outflows would have carried it' : 'missed';
    const cls = v.effectiveMet ? 'met' : v.flagged ? 'flag' : 'miss';
    return `<tr><td>${v.period}</td><td class="num">${money(v.metricValue)}</td>
      <td class="num">${v.oneOffOutflows ? money(v.oneOffOutflows) : '—'}</td>
      <td class="${cls}">${esc(state)}</td></tr>`;
  }).join('');
}

const cards = clauses.map((c) => {
  const refused = c.reasons.length > 0;
  const settled = c.settled?.payout;
  // The label already reads "Case name — what makes it interesting"; splitting on
  // the dash gives a heading a human wrote rather than one derived from an id.
  const [first, ...rest] = c.label.split(/\s+[—–-]\s+/);
  // Real cases carry their own name; the synthetics are all labelled "Synthetic",
  // so those fall back to the id, which is what distinguishes them.
  const name = /^synthetic$/i.test(first.trim())
    ? c.id.replace(/^Synthetic/, 'Synthetic: ').replace(/([a-z])([A-Z])/g, '$1 $2')
    : first;
  const sub = /^synthetic$/i.test(first.trim()) ? c.label : rest.join(' — ');
  const head = `<h3>${esc(name)}</h3>${sub ? `<p class="label">${esc(sub)}</p>` : ''}`;
  if (refused) {
    return `<article class="c refused">${head}
      <p class="badge no">Refused — not expressible in the signed terms</p>
      <ul>${c.reasons.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
      <p class="prov">${esc(c.provenance)}</p></article>`;
  }
  const match = settled !== undefined && settled !== null && c.ev.payout === settled;
  return `<article class="c">${head}
    <p class="badge yes">Compiles — replayed on the ledger</p>
    <p class="terms">Target <b>${money(c.terms.metricTarget)}</b> per period · ${c.terms.periods} period${c.terms.periods > 1 ? 's' : ''} ·
      ${c.terms.payout.requiredPeriodsMet} must be met · tranche <b>${money(c.terms.payout.amount)}</b></p>
    <table><thead><tr><th>Period</th><th>Reported</th><th>One-off outflows</th><th>Verdict</th></tr></thead>
      <tbody>${periodRows(c)}</tbody></table>
    <p class="result">${c.ev.metCount} of ${c.terms.periods} met → this model pays <b>${money(c.ev.payout)}</b>${
      settled === undefined || settled === null ? '' :
      ` · the parties settled on <b>${money(settled)}</b> <span class="badge ${match ? 'yes' : 'no'}">${match ? 'MATCH' : 'DIVERGES'}</span>`}</p>
    <p class="prov">${esc(c.provenance)}</p></article>`;
}).join('\n');

const compiled = clauses.filter((c) => !c.reasons.length).length;
const publicOnes = clauses.filter((c) => /^case-/.test('') || c.id.startsWith('Case'));

const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Clauses this model was not written for</title>
<style>
 :root{--ink:#0E1A2B;--body:#2A3B52;--mute:#6B7C93;--rule:#DFE5EC;--accent:#1B4D8F;--panel:#F5F7FA;--bg:#fff;--no:#8A3324;--yes:#1D6B4F;--flag:#8A6D1A}
 @media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--ink:#EAF0F7;--body:#C2CFDE;--mute:#8A9BB0;--rule:#243347;--accent:#6FA8E0;--panel:#14202F;--bg:#0B131D;--no:#E2A08F;--yes:#7FC9A8;--flag:#D9BC72}}
 *{box-sizing:border-box;margin:0;padding:0}
 body{background:var(--bg);color:var(--body);font:16px/1.6 -apple-system,"SF Pro Text","Helvetica Neue",Arial,sans-serif;padding:40px 16px 64px}
 .w{max-width:860px;margin:0 auto}
 .kick{font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--accent);font-weight:700}
 h1{font-size:32px;line-height:1.15;color:var(--ink);letter-spacing:-.02em;margin:10px 0 12px}
 p.lede{font-size:18px}
 .c{margin-top:26px;padding:20px;border:1px solid var(--rule);border-radius:4px;background:var(--panel)}
 .c.refused{background:var(--bg)}
 h3{font-size:19px;color:var(--ink)}
 .label{font-size:14px;color:var(--mute);margin:2px 0 12px}
 .badge{display:inline-block;font-size:12px;font-weight:700;letter-spacing:.04em;padding:3px 8px;border-radius:3px}
 .badge.yes{color:var(--yes);border:1px solid var(--yes)}
 .badge.no{color:var(--no);border:1px solid var(--no)}
 .terms{margin:12px 0 10px;font-size:15px}
 table{width:100%;border-collapse:collapse;margin:8px 0 12px;font-size:14.5px}
 th{text-align:left;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--mute);border-bottom:1px solid var(--rule);padding:6px 8px}
 td{padding:7px 8px;border-bottom:1px solid var(--rule)}
 td.num{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
 td.met{color:var(--yes)} td.miss{color:var(--no)} td.flag{color:var(--flag)}
 .result{font-size:16px;color:var(--ink);margin-top:10px}
 .prov{margin-top:12px;font-size:13px;color:var(--mute)}
 .c ul{margin:10px 0 0 20px} .c li{margin-bottom:8px;font-size:14.5px}
 footer{margin-top:40px;padding-top:14px;border-top:1px solid var(--rule);font-size:13px;color:var(--mute)}
 a{color:var(--accent)}
</style></head><body><div class="w">
<div class="kick">Earnout Settlement Ledger · the replay</div>
<h1>Clauses this model was not written for</h1>
<p class="lede">The test that could kill this project: take earnout clauses <b>we did not write</b>, express them in the terms the contract signs, and replay each one's own history. If the ledger lands on the payout the parties actually made, the premise holds for that shape. If a clause cannot be expressed at all, that is published with the reason rather than approximated away. ${compiled} of ${clauses.length} compile.</p>
${cards}
<footer>
Generated from <a href="https://github.com/kimsabin725/earnout-settlement-ledger/tree/main/replay/clauses">replay/clauses/</a> by <code>docs/build-replay.mjs</code>, using the same rules the harness uses — so this page cannot claim something <code>replay/run.sh</code> would not. The arithmetic here is the pre-check; the ledger run is the answer, and it is in <a href="https://github.com/kimsabin725/earnout-settlement-ledger/blob/main/docs/validation.md">docs/validation.md</a>.
<br><br>
Wondering about your own clause? <a href="clause-check.html">Two minutes, nothing leaves your browser.</a>
</footer>
</div></body></html>
`;
fs.writeFileSync(path.join(here, 'replay.html'), html);
console.log(`docs/replay.html — ${clauses.length} clauses, ${compiled} compile`);
