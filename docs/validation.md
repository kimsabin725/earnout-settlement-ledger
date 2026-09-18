# Validation — practitioner interviews

Goal: evidence for the judging dimension "Validation" (user research / early testing). Target 3 conversations, 15–20 minutes each, by Oct 2.

## Who
1. M&A advisor / boutique banker who has drafted an earnout (small–mid market).
2. Escrow agent or law firm paralegal who has administered an earnout payout.
3. Search-fund or founder-exit operator who has been on the receiving side of one.

## Outreach (LinkedIn / email, EN)
> Hi <name> — I'm building a small prototype that fixes an earnout's payout rules, data source and arbiter at signing, so post-closing metrics can't be re-argued later. I'd value 15 minutes of your experience with earnouts that went sideways — no pitch, just questions. Would <two slots> work?

## Outreach (KR)
> 안녕하세요, <이름>님. M&A 언아웃(earnout)의 판정 기준·데이터 출처·중재인을 계약 시점에 고정해서 사후 분쟁을 줄이는 프로토타입을 만들고 있습니다. 언아웃이 꼬였던 경험을 15분만 여쭙고 싶습니다. 영업 아니고 질문만 드립니다. <두 시간대> 중 가능하실까요?

## Questions (ask in this order, record answers verbatim)
1. Last earnout you touched: what metric, how many periods, who computed the number?
2. Where did the first disagreement come from — the number itself, the definition, or the timing?
3. What did the seller actually see of the buyer's books? What did they want to see?
4. Who would you trust to attest the number — the bank, an accountant, the buyer's CFO? Why?
5. If the payout rules were locked at signing and the bank signed the account snapshot each quarter, what breaks? (Listen for: classification of one-offs, timing games, who pays the fee.)
6. Who pays for a service like this today — the deal, the buyer, the seller, the advisor?

## Findings
(Fill after each call: date · role · 3 quotes · what we changed because of it.)

---

# Public-record replays (Sep 18, 2026)

Before asking practitioners for their own clauses, I ran the replay harness (`replay/`) against
earnout clauses that are already public — Delaware opinions, where the clause language and
sometimes the figures are on the record. The point was to find out what a real clause looks like
before assuming my signed terms can hold one. Five clauses, one fits, and that result is not
flattering, which is why it is written down here.

| Clause | Source | Result |
|---|---|---|
| Prosser v. PharmaLogic Holdings | C.A. No. N25C-08-284 MAA CCLD (Del. Super. CCLD, Jul 7, 2026) | **Compiles and replays on the ledger to the payout that was actually made ($0).** |
| Lazard Tech. Partners v. QinetiQ (Cyveillance) | No. 464,2014 (Del. Apr 23, 2015) | Not expressible — "up to $40 million" is a tiered payout. The threshold and the actual revenues are not in the opinion either. |
| Winshall v. Viacom (Harmonix) | Del. Ch. 2011, aff'd Del. 2013 | Not expressible — 3.5x the excess over a threshold that rises between periods, uncapped. The opinion discloses neither year's Gross Profit nor what was paid. |
| Fortis Advisors v. Johnson & Johnson (Auris Health) | Del. Ch. 2024–26; Del. Supreme Court No. 490,2024 (Jan 12, 2026) | Not expressible — FDA regulatory milestones. The trigger is an event, not a figure. |
| In re SwervePay Acquisition | Del. Ch., Jul 31, 2026 | Not expressible — "up to $53.75m" pro-rated against a payment-volume baseline, across two revenue definitions. |

## What this changes

**1. One real clause does replay, and it is the interesting kind.** PharmaLogic's earnout paid
$6.6m if earnout-period EBITDA reached $7,000,000. The buyer's earnout statement reported
$6,800,000 — $200,000 short — and nothing was paid. Expressed in the signed terms, the ledger
reaches the same $0. That is the first end-to-end reproduction of a real earnout outcome on this
model, and it took one clause file.

**2. The flag would not have fired, and that is a real limitation.** The sellers allege the buyer
depressed the figure with higher bad debt, a new 401(k) match, sales bonuses and "more than
$170,000 in additional expenses from switching to a new supplier". Only that last item is
quantified in the public record. $6,800,000 + $170,000 is still below $7,000,000, so the contract's
suppression flag stays silent on the one number anyone has published. The other allegations are
about *new expense categories appearing after closing*, which the model has no way to see: it
evaluates the attested figure, and a buyer who books a new charge inside the definition produces
an honest attestation of a manipulated number. The bank attests the cash, not the accounting
policy.

**3. The court said the auditor could not fix it, which is the product thesis and its boundary at
once.** The agreement did send disputes to an independent auditor, but its role was "limited to
disputes over the 'amounts'", so when the sellers alleged improper intent the claim went to court
anyway. Fixing the forum at signing is necessary and was not sufficient, because the forum's scope
was drawn around arithmetic and the fight was about conduct. My arbiter role has the same shape
and therefore the same hole.

**4. Four of five public clauses cannot be expressed at all.** Tiered, interpolated, formula and
period-varying targets are the norm in the record, not the exception, and the harness refuses them
by design rather than approximating them. That is the honest state of the premise: the
all-or-nothing, count-of-periods form is a real structure — PharmaLogic's tier is exactly it — but
it is one shape among several, and a product that only serves that shape serves a slice of the
market. Extending the signed terms to a tiered payout is the obvious next design question, and it
has to be a signed computation, not an amendment.

**5. Milestones are a different product, not a wider target.** Auris's earnout — up to $2.35bn —
hung on FDA regulatory milestones, one of them a $100m Soft Tissue Ablation Milestone. None was
achieved after the FDA changed the required clearance pathway. There is no number to compare to a
threshold. `MetricAttestation` carries a figure signed by a bank;
a milestone needs a party who signs that an event occurred, and whoever that is (a regulator's
public register, a named expert) is not a bank and does not attest cash. The refusal here is
honest and also a warning: life-sciences earnouts are routinely milestone-shaped rather than
metric-shaped, and serving them is a second attestation template, not a bigger `Decimal`. (How
large that segment is, I have not measured and do not claim.)

**6. SwervePay is the case this product cannot help with, and I would rather say so first.** The
fight there was not about the post-closing computation. The buyers represented roughly $34bn of
payment volume as the baseline the earnout would convert; the actual volume was about $5.2bn. A
ledger that locks the rules at signing locks in a baseline that was already wrong at signing. The
court reached it as fraud and awarded $75,692,297. Nothing in my design prevents a party from
signing terms built on a misrepresented input — it prevents changing the rules afterwards. Fixing
the pre-signing fact is diligence, not settlement infrastructure.

This was pre-registered: the plan said a clause that does not compile gets published with the
reason instead of the model being quietly widened until it fits. Two did not compile. Here they are.
