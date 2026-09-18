# Six lines, for judges and for Q&A

Written Sep 18, 2026, after five public clauses went through `replay/`. Keep these in sync with
`docs/validation.md` — if a claim here is not true there, this file is the one that is wrong.

**Problem** — In a private-company earnout the buyer owns the books, the metric computation and the timing after closing, so the seller cannot verify the number and the buyer cannot prove it, and 28% of these end in dispute at roughly 21 cents on the promised dollar.

**ICP** — Sell-side M&A advisors and the deal lawyers who draft the earnout clause in the US and Western European mid-market, EUR/USD 20-80m enterprise value, five or more earnout deals a year.

**Proof** — Five public earnout clauses run through our replay harness: Prosser v. PharmaLogic compiles and replays on Canton to the payout that was actually made, and the other four are refused with a stated reason rather than approximated.

**MVP** — A four-party Daml application on Canton where the metric definition, threshold, attestor and arbiter are co-signed at closing, each period is evaluated from a bank-signed figure, flagged periods route to the arbiter named at signing, and settlement transfers the tranche and closes the contract in one transaction, with five adversarial submissions asserted to fail and two more unrepresentable in the model.

**Limitation** — It works where the payout is a computation over a number a third party can sign each period, and not for event milestones, sliding or tiered payouts, moving targets, or a baseline that was already misrepresented before signing.

**Ask** — Three practitioner clauses to replay, an introduction to one escrow or paying agent, and DevNet party provisioning so the privacy separation is provable from the API rather than asserted.
