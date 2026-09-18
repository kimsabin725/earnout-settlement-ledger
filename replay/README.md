# Replay harness

The success metric for this hackathon is not a demo that runs. It is this:

> three real earnout clauses, drafted by practising M&A lawyers and not by me, each compile
> into the ledger's metric definition format and replay their entire historical quarterly
> schedule on Canton, producing the payout the parties actually settled on.

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
| `template.json` | For a practitioner's clause. |

All three fixtures are synthetic. **No real clause has been replayed yet** — collecting them is
the open work, and it is the part that decides whether the premise holds.

## SDK note

The packages pin `sdk-version: 3.5.2` (the Canton 3.x line), which is not installable from
the public `daml install` channel. `run.sh` therefore falls back to whatever SDK is present
(`DAML_SDK_VERSION`), and the model compiles either way because it targets LF 2.2.

One consequence worth knowing before a deployment: building with the fallback SDK **rewrites**
`ledger/.daml/dist/earnout-ledger-0.0.6.dar`, and a DAR built by a different SDK is a
different package on the ledger. Anything uploaded to DevNet must be built in the pinned
3.5.2 environment (the cn-quickstart devshell), not by this harness.
