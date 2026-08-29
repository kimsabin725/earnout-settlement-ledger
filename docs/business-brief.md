# Earnout Settlement Ledger — 1-Page Business Brief (draft)

**Problem** — Earnouts bridge M&A valuation gaps (24% of private deals) but 28% end in dispute; actual payouts average ~21% of stated potential (SRS Acquiom, 2,300+ deals). Root cause: post-closing metrics are computed by the buyer, on the buyer's books, verified by no one the seller trusts.

**ICP** — (1) Small/mid-market M&A where W&I insurance and heavyweight escrow economics don't fit: search funds, individual acquirers, succession deals. (2) M&A advisors/escrow agents seeking a productized earnout service. (3) Banks financing acquisitions — earnout de-risking directly reduces their credit exposure.

**Who pays** — The deal pays: a fixed fee per earnout administered (vs. 1–10% success fees for advisory, tens of thousands for accounting arbitration after disputes). The paying bank is the natural distributor: it already holds the designated account, provides acquisition financing, and gains deposit + fee income.

**Why Canton** — (1) A private company's quarterly financials cannot be public → sub-transaction privacy, per-party visibility. (2) No neutral home exists for the record: buyer's DB, seller's DB, or escrow — each is conflicted → a ledger neither side owns or can amend. (3) Adjudication and payment settle atomically → no post-judgment collection gap.

**What exists today** — Escrow (holds money, doesn't adjudicate) · W&I insurance (bid/PE-market centric) · accounting arbitration (engaged after the dispute, over records made unilaterally) · litigation (seller bears proof burden). None fixes the record *at signing*.

**MVP (built)** — 4-party Daml workflow on Canton LocalNet: terms locked at signing → bank-attested quarterly metrics (single-use, order-enforced) → auto-adjudication with suppression flags → scoped arbiter resolution → atomic token settlement. 7 adversarial scenarios rejected by the ledger, all covered by tests.

**Pilot path** — (1) One escrow agent or M&A advisor runs a shadow earnout alongside a real deal (read-only pilot, mock payment leg). (2) Bank attestation via existing account-statement APIs. (3) Payment leg in tokenized cash (e.g., regulated stablecoin or tokenized deposit) on Canton.

**Limitations disclosed** — Oracle boundary (attestor truthfulness), metric classification rules, cash-flow timing manipulation (mitigated by multi-quarter structure, not eliminated), cause attribution stays human.
