# Earnout Settlement Ledger

**Tamper-proof earnout adjudication on Canton — the judgment logic, data source, and arbiter are locked at signing, and neither side can change them afterward.**

Built for HackCanton Season 3 (RWA & Business Workflows track).

## The problem

- **24%** of private M&A deals use earnouts (deferred payments tied to post-closing performance; ABA Private Target Deal Points Study) — and **28% of them end in dispute** (SRS Acquiom). Earnouts pay out only ~21 cents on the dollar of their stated potential (SRS Acquiom, Kroll).
- The root cause: **post-closing books are controlled by the buyer.** The seller cannot verify the numbers, and in litigation the seller bears the burden of proof over books the buyer keeps.
- The classic dispute — *"that one-off expense was operationally necessary"* vs. *"you suppressed earnings to avoid the payout"* — is argued years later over records neither side agreed on at the time.

## What this does

A four-party workflow on Canton that removes the trust gap by construction:

```
Propose ─→ Accept (terms locked)
             │
   Bank signs account snapshot ─→ Buyer submits ─→ Verdict (auto-adjudicated)
             │            (quarters in order, once each — ledger-enforced)
             │
   flagged verdict ─→ Seller disputes ─→ Arbiter resolves (narrow, recorded)
             │
   Finalize (3-of-4 met) ─→ Settlement obligation ─→ Settle
                                    (token transfer + closure in ONE transaction)
```

| Party | Responsibility | Nature |
|---|---|---|
| **Buyer** (acquirer) | Submits quarterly metrics, pays the tranche | Cannot forge, amend, skip, or resubmit |
| **Seller** | Reviews verdicts, disputes flags, finalizes | Sees results — never the buyer's raw books |
| **Bank** (attestor) | Signs designated-account snapshots | Attests facts, not judgment — what banks already do |
| **Arbiter** | Resolves flagged quarters only | Scope fixed at signing; reasoning recorded on-ledger |

Responsibility is deliberately **decomposed**: facts → attestor, rules → contract, interpretation → arbiter. No single party holds the ledger.

## Why Canton

*"If this moved to a globally transparent chain tomorrow, what breaks?"* That question is the one
worth asking about any application claiming it needs a particular chain, and it has three answers
here. The first is the one encryption cannot reach.

**Hide every figure and a transparent chain still publishes what happened.** That the buyer filed
late. That a quarter was disputed. That the arbiter was called. In an earnout none of that is
metadata: a visible dispute tells a competitor the acquisition is going badly and tells the other
side that leverage has appeared, while the deal is still running. Canton has no global shared
state — a transaction exists only for the parties named in it, so the dispute is a fact between
buyer, seller and arbiter and to everyone else it did not occur.

The logic would survive a move to a transparent chain. The willingness to sign would not, and
every party this is built for is one whose reason for agreeing to an earnout at all is that the
outcome is not yet public.

### The transparent-chain test

*"If this moved to a globally transparent chain tomorrow, what breaks?"*

1. **The acquirer's quarterly financials would be public.** A private company's revenue, cash flow, and account activity cannot go on a transparent chain. Here, the seller sees *verdicts and metric values only*; raw transaction data stays off-chain, hash-committed; the arbiter accesses the basis only on dispute.
2. **A central database has no home.** The buyer's system? The seller won't trust it (that *is* the problem). The seller's? Symmetric. An escrow agent holds money but does not adjudicate. The product is precisely *a record neither side can own or amend*.
3. **Adjudication and payment settle atomically.** Verdict finalization creates a payment obligation; `Settle` transfers the token and closes the contract in a single transaction — no "judgment won, payment stalled" gap.

## Adversarial properties (all ledger-enforced — five asserted by tests, two unrepresentable)

| Attack | Result |
|---|---|
| Buyer creates a favorable verdict alone | ❌ rejected — verdict requires both signatures |
| Buyer submits metrics without a bank attestation | ❌ rejected — choice requires an attestation contract |
| Buyer self-issues an attestation | ❌ rejected — attestor signature required |
| Reusing a consumed attestation | ❌ rejected — single-use, archived on submission |
| Resubmitting or skipping a quarter | ❌ rejected — agreement tracks `nextQuarter` |
| Padding `Finalize` with duplicate verdicts | ❌ rejected — deal-scoped, distinct-quarter check |
| Amending terms after signing | ❌ impossible — no such choice exists in the model |

Run them yourself: `dpm test --package-root tests` (21 transactions, 5 must-fail scenarios).

## Repository layout

```
ledger/   Daml templates (earnout-ledger) — the state machine, no test deps
tests/    daml-script scenario incl. adversarial cases (earnout-tests)
ui/       zero-dependency Node backend (JSON Ledger API v2) + 3-pane demo UI
scripts/  end-to-end scenario against LocalNet via curl (backend reference)
```

## Running it

Prereqs: JDK 17+, [DPM](https://docs.digitalasset.com/), Docker Desktop (8 GB), the
[cn-quickstart](https://github.com/digital-asset/cn-quickstart) LocalNet.

```bash
# 1. Build and test the model
dpm build --all
dpm test --package-root tests

# 2. Start LocalNet (in your cn-quickstart clone)
cd cn-quickstart/quickstart && make setup && make build && make start

# 3. Start the demo (uploads the DAR, onboards parties, serves the UI)
node ui/server.mjs
# → http://localhost:8090        (Korean)
# → http://localhost:8090?lang=en (English)
```

The UI is a deliberate demonstration of Canton's visibility model: each panel renders
that party's **actual ACS** from the participant node. The arbiter's panel has no
CashToken; the seller's has no raw basis. That is not UI filtering — it is the ledger.

## Honest limitations

- **The oracle boundary.** The ledger guarantees *who signed what, when, and that nobody can change it* — not that the signed numbers are true. Data truthfulness sits with the attestor (a regulated bank signing its own account records — a function banks already perform). A colluding attestor defeats the system, as it defeats every audit regime.
- **Operating vs. non-operating classification.** The MVP has the bank attest a computed metric. A production design would fix the classification rules in the SPA and have the bank attest only the raw snapshot.
- **Cash-flow timing.** A buyer can shift payment dates across quarter ends. The 3-of-4 structure preserves totals across quarters and quarter-end bulk payments are flaggable, but this is mitigation, not prevention.
- **Attribution.** The ledger fixes *numbers*, not *causes* — whether underperformance stems from suppression or a lost customer stays a human question, scoped to the arbiter.

## Status and provenance

**Pre-hackathon foundation (Aug 2026, before Season 3 opened).** Disclosed per the hackathon rules on pre-existing code.
- Daml model `0.0.6` (4-party workflow; 5 adversarial scenarios asserted to fail under `submitMustFail`, plus 2 that the model cannot express at all).
- LocalNet end-to-end run on cn-quickstart (JSON Ledger API v2, OAuth2/Keycloak), 3-panel demo UI, 59-second demo recording.
- Everything up to and including commit `Brief: drop draft marker` belongs to this phase.

**Built during Season 3 (Sep 18 – Oct 9, 2026).** Every commit from Sep 18 onward is listed in
`docs/s3-log.md` with its hash and what it changed; the earliest of them also carry an `[S3]`
subject tag, which was dropped once the log itself became the record.
- [ ] DevNet deployment on the shared HackCanton node — DAR upload, party provisioning, live transaction IDs. *Prepared: the model is built with SDK 3.5.2, the version DevNet runs, and the demo server takes the ledger, the token and the four parties from the environment (`LEDGER_API`, `LEDGER_TOKEN`, `PARTY_*`) instead of assuming LocalNet. What is left needs the node itself.*
- [ ] Per-party users on DevNet (today one validator user acts for all four parties — a demo shortcut). The privacy claim is then verifiable from the API: the seller's token cannot read the buyer's raw submission.
- [x] The clause replay harness (`replay/`) — turns a written earnout clause into signed terms the contract can evaluate, then replays the clause's own historical schedule on the ledger and asserts the payout the parties settled on. A clause the signed terms cannot express is rejected with the reason instead of approximated. Two synthetic clauses replay green today; **no practitioner clause has been run through it yet**, and that is the open half of the success metric.
- [ ] Bank attestation from a statement file (CSV) instead of a typed-in number, so the attestor signs what its own records say.
- [x] A structural survey of the public record — nine Delaware earnout disputes classified by payout shape. Two of nine are the shape this model serves; four are event milestones and three are tiered or formula payouts. The sample is litigated rather than representative, and `docs/validation.md` says so rather than quoting the flattering reading.
- [x] [**The replay, as a page**](https://kimsabin725.github.io/earnout-settlement-ledger/replay.html) — every clause file, period by period, with the payout this model computes next to the one the parties actually settled on. Generated from the clause files by the same rules the harness uses, so it cannot claim something `replay/run.sh` would not.
- [x] [**A clause self-check**](https://kimsabin725.github.io/earnout-settlement-ledger/clause-check.html) — the same refusal rules as `replay/compile.mjs`, asked in words rather than JSON, running entirely in the reader's browser. It exists because the honest version of "would your clause have compiled?" was asking practitioners for figures from a closed deal, and the answer to that is no. It asks for none: the verdict depends on the shape, and the one-line verdict is the only thing worth sending back.
- [ ] Validation interviews with earnout practitioners (M&A advisors / escrow agents / search-fund operators) — findings and changes recorded in `docs/validation.md`.
- [ ] Journal, pitch deck, and pilot brief revisions from the above.

## Running it against a ledger

LocalNet is the default, because it is what a clone can bring up:

```
cd app && node ui/server.mjs          # reads its credentials out of the splice-onboarding container
```

The shared DevNet node is a guest arrangement — the token comes from the Console Wallet and the
parties are provisioned for us — so nothing is minted locally:

```
LEDGER_API=https://<node>/ LEDGER_TOKEN=<jwt> LEDGER_USER_ID=<user> \
PARTY_EBUYER=… PARTY_ESELLER=… PARTY_EARBITER=… PARTY_EBANK=… \
node ui/server.mjs
```

A DAR upload that the shared node refuses is reported and stepped over, because there the DAR
arrives out of band.

## License

Apache License 2.0 — see [`LICENSE`](LICENSE). Apache-2.0 rather than MIT because this is ledger
code with an explicit patent grant, which is what an enterprise counterparty evaluating it would
expect, and it is the license the Daml and Canton ecosystem itself uses.
