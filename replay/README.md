# Replay harness

The success metric for this hackathon is not a demo that runs. It is this:

> earnout clauses **we did not write** must compile into the ledger's signed terms and replay
> their own historical schedule to the payout that was actually made.

Five clauses from the public record have been run. One — Prosser v. PharmaLogic Holdings —
compiles and replays on the ledger to the $0 that was actually paid. Four are refused as
inexpressible, and `docs/validation.md` publishes the reason for each rather than widening the
model to raise the pass rate. A clause drafted by a practising lawyer is the next input, not a
claim already banked.

This directory is the machine that answers that. It is deliberately falsifiable: if a
practitioner's clause cannot be expressed in the signed terms, the harness says so and stops,
because *that* is the finding.

## Use

```bash
replay/run.sh                          # every clause in replay/clauses
replay/run.sh replay/clauses/x.json    # one clause
```

Two stages run, in this order.

**1. Does it compile?** `compile.mjs` checks the clause against what `EarnoutTerms` can
actually hold: one metric, a per-period target, a count of periods that must be met, and one
all-or-nothing tranche. A cumulative target, a sliding payout, a cap, two metrics — none of
these have a home in the signed terms, and the harness prints the reason rather than
approximating the clause into something the parties never agreed to. `synthetic-cumulative-ratchet.json`
is kept as a fixture precisely because it fails this stage.

**2. Does it reproduce the settled payout?** For a clause that compiles, the harness emits a
Daml Script into `tests/daml/Replay/` that runs the clause's own historical schedule through
the real contracts — bank attestation, submission, verdict, any dispute the parties actually
had, arbitration, finalization, settlement — and asserts that the amount reaching the seller
equals the amount the parties settled on. A divergence fails the script on the ledger, not in
a spreadsheet.

The arithmetic in `compile.mjs` mirrors the model and is only a pre-check, so a mistake in it
cannot make a replay pass. The ledger run is the answer.

## Writing a clause file

Copy `clauses/template.json`. The fields that matter:

| Field | What it is |
|---|---|
| `terms.periodBasis` | `per-period` is the only basis the contract evaluates. |
| `terms.metricTarget` | The per-period threshold, as drafted. |
| `terms.payout` | `all-or-nothing`, the tranche amount, and how many periods must be met. |
| `schedule[]` | What each period actually reported: the metric, any one-off outflows, the evidence hash. |
| `schedule[].dispute` | Only where the parties actually disputed, with how the arbiter resolved it. The ledger permits a dispute only on a flagged verdict, so a dispute recorded anywhere else is itself a finding. |
| `settled.payout` | What was actually paid. This is the assertion. |
| `provenance` | Where the clause came from. Real clauses are shared with permission and redacted; invented ones say SYNTHETIC. |

## What is in here today

| Clause | Status |
|---|---|
| `synthetic-suppressed-period.json` | Compiles; replays to the full tranche after the arbiter excludes an allocated charge. |
| `synthetic-missed-earnout.json` | Compiles; replays to nothing paid, two of four periods met. |
| `synthetic-cumulative-ratchet.json` | Does not compile, on purpose — cumulative basis, sliding payout, a cap. |
| `case-prosser-pharmalogic.json` | Public record. Compiles, and replays to the payout that was actually made ($0). |
| `case-lazard-qinetiq.json` | Public record. Not expressible — a tiered "up to $40m" payout, with the threshold missing from the opinion. |
| `case-winshall-viacom.json` | Public record. Not expressible — 3.5x the excess over a threshold that rises between periods. |
| `case-fortis-auris.json` | Public record. Not expressible — the trigger is a regulatory event, not a figure. |
| `case-swervepay.json` | Public record. Not expressible — a pro-rated "up to" amount across two revenue definitions. |
| `template.json` | For a practitioner's clause. |

One clause from the public record replays end to end; four others are refused with the reason.
`docs/validation.md` records what that told us, including the part that does not flatter the
model. **No clause from a practitioner has been through it yet** — collecting those is the open
work, and it is the part that decides whether the premise holds.

## SDK note

The packages pin `sdk-version: 3.5.2` — the version the Canton quickstart uses, and the one this
model is deployed with on DevNet. It is served by **dpm**, the Daml package manager, and not by the
older `daml install` channel, which is why an earlier pin at 3.5.2 looked unbuildable: the wrong
tool was being asked.

`replay/run.sh` prefers dpm and falls back to the legacy assistant. The fallback compiles fine —
the model targets LF 2.2 either way — but it is worth knowing what it costs:

**the SDK that builds a DAR decides that DAR's package id, and a different package id is a
different package on the ledger.** The replays run either way. The artifact uploaded to DevNet has
to be the 3.5.2 build, not a fallback build that merely passes the same tests.

For the record, the two are:

| built with | package id |
|---|---|
| 3.5.2 (dpm, deployed) | `8ab2c2c3…86a3ba3` |
| 3.4.11 (legacy assistant) | `e8ff9b5c…fff3531d` |

Nothing in the app hardcodes either one: the UI addresses templates by package *name*
(`#earnout-ledger:Earnout`), so a rebuild does not strand it.
