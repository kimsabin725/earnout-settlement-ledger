# Validation — practitioner interviews

Goal: evidence for the judging dimension "Validation" (user research / early testing). Target 3
conversations, 15–20 minutes each, by Oct 2.

**What changed on Sep 20, and why this section was rewritten.** The plan was to ask a practitioner
for nine figures from a closed earnout. That is a request a deal lawyer is right to refuse, and
building outreach on it meant a plausible outcome of zero replies and zero evidence. But the
question that matters — *would your clause have compiled at all* — never needed figures. The
refusal rules read the **shape** of a clause, not its numbers, and they are ordinary JavaScript.
So they now run in the reader's own browser:

**<https://kimsabin725.github.io/earnout-settlement-ledger/clause-check.html>**

Eight plain-English questions, no server, no analytics, no request of its own, no figures asked
for. It reproduces the harness's verdict on all five public clauses already replayed. What comes
back is one line — `REFUSED — tiered payout` — which contains nothing confidential and is the
entire finding.

The ask is now "spend two minutes, tell me if it got your clause wrong", not "send me your deal
data". Whether that converts is itself the thing being tested.

## Who

The structural survey below changed this list. Life-sciences earnouts are milestone-shaped by
default, so a life-sciences lawyer is the wrong first call — the model cannot hold their clauses
and both sides would learn nothing new. The clause most likely to fit comes from a lower middle
market services or distribution deal, where the metric is EBITDA or revenue and the tranche is a
cliff.

1. Sell-side M&A advisor at a lower-middle-market boutique — services, distribution, light
   manufacturing. The shape most likely to compile.
2. Escrow or paying agent who has administered an earnout payout. They sit in the money flow,
   already hold both signatures, and talk to strangers for a living.
3. Search-fund or founder-exit operator who has been on the receiving end of one.

Not on the list, deliberately: life-sciences and biotech deal counsel, until there is a second
attestation template for event milestones.

## Outreach (EN)

> Hi <name> — I put an earnout on a ledger where the metric, the target and the arbiter are signed
> once at closing and cannot be changed afterwards, and I need to know whether real clauses can be
> expressed that way at all.
>
> I ran it against five earnout clauses from the Delaware record first, so I would not be asking
> you to find out something I could find out myself. One — Prosser v. PharmaLogic — replays to the
> payout that was actually made: nothing, on a $200,000 shortfall. **Four of the five could not be
> expressed at all**, and I published the reason for each rather than widening the model until they
> fit.
>
> Two minutes, if you have them: <link>. Eight questions about the shape of a clause — no figures,
> nothing leaves your browser, no sign-up. If it refuses your clause, that one line is what I am
> looking for, and it is worth more to me than a meeting.
>
> If it is wrong about your clause, that is the most useful thing anyone could send me.

## Outreach (KR)

> 안녕하세요, <이름>님. M&A 언아웃의 판정 기준·데이터 출처·중재인을 계약 시점에 고정해 사후 분쟁을
> 줄이는 원장을 만들고 있습니다. 제가 확인하지 못한 건 하나입니다 — **실제 조항이 그렇게 표현될 수
> 있는가.**
>
> 먼저 델라웨어 공개 판례 5건으로 돌려봤습니다. 1건(Prosser v. PharmaLogic)은 실제 지급액을 그대로
> 재현했고, **4건은 아예 표현이 불가능**했습니다. 모델을 넓혀 맞추는 대신 거부 사유를 그대로
> 공개했습니다.
>
> 2분만 내주신다면: <링크>. 조항의 *형태*에 대한 8문항이고 **숫자는 묻지 않으며 입력한 내용이 브라우저
> 밖으로 나가지 않습니다.** 거부가 나오면 그 한 줄이 제가 찾는 답입니다.
>
> 틀린 판정이 나왔다면, 그게 가장 값진 회신입니다.

## Questions (only if they offer a call — the self-check is the primary ask)

1. Last earnout you touched: what metric, how many periods, who computed the number?
2. Where did the first disagreement come from — the number itself, the definition, or the timing?
3. What did the seller actually see of the buyer's books? What did they want to see?
4. Who would you trust to attest the number — the bank, an accountant, the buyer's CFO? Why?
5. If the payout rules were locked at signing and the bank signed the account snapshot each quarter,
   what breaks? (Listen for: classification of one-offs, timing games, who pays the fee.)
6. Who pays for a service like this today — the deal, the buyer, the seller, the advisor?

## Findings — verdicts received

The primary evidence is a verdict line from someone who holds a real clause. One line per reply,
including the ones that say the check got it wrong, which are the valuable ones.

| Date | Who (role, no names) | Verdict line | Did the check get it right? | What changed because of it |
|---|---|---|---|---|
| — | — | — | — | *(nothing yet — no reply has come back)* |

**Counted as a reply:** a verdict line, or a sentence saying the check misread their clause.
**Not counted:** "interesting, keep me posted". That is logged as a non-reply, because treating it
as evidence is how a validation section becomes decoration.

**If a reply says the check got it wrong,** the fix is in one of two files and the difference
matters. If the *question* misread the clause, `docs/clause-check.html` is wrong and the model is
fine. If the *model* cannot hold a clause it should, `replay/rules.mjs` is wrong and the signed
terms need to change. `replay/page.test.mjs` exists to keep those two honest with each other, and
a new reply becomes a new fixture in it.

## Findings — calls
(Only if someone offers one. Fill after each: date · role · 3 quotes · what we changed because of it.)

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

# What shape are real earnouts? (Sep 20, 2026)

Finding 5 above ended with "how large that segment is, I have not measured and do not claim." This
measures it, in the only sample that is fully public: earnout disputes that reached a Delaware
court and were written up by law firms. Nine distinct cases, classified by the **structure of the
payout**, not by who won.

Every row's structure is taken from the source named beside it, and the wording of a deal's terms
is the source's. Where a summary says a figure was not disclosed, none is supplied here.

| Case | Court, date | Structure | Expressible? | Structure taken from |
|---|---|---|---|---|
| Prosser v. PharmaLogic Holdings | Del. Super. CCLD, Jul 7 2026 | Per-period EBITDA against a fixed threshold, all-or-nothing | **Yes — replayed to the $0 actually paid** | the clause file's own provenance, `replay/clauses/case-prosser-pharmalogic.json` |
| AM Buyer v. Argosy | Del. Super., Sep 3 2024 | "Earnout Period EBITDA", determined by an independent accountant | **Probably — the figures are not public, so it has not been run** | Jones Day (Apr 2025) |
| Himawan v. Cephalon | Del. Ch., Apr 30 2024 | Regulatory milestones for two drug indications | No — the trigger is an event | Jones Day (Apr 2025) |
| Fortis Advisors v. Johnson & Johnson (Auris) | Del. Ch., Sep 4 2024 | Commercial and regulatory milestones | No — the trigger is an event | the clause file's own provenance, `replay/clauses/case-fortis-auris.json` |
| SRS v. Alexion (Syntimmune) | Del. Ch., Sep 5 2024 | Eight milestones, up to $800m | No — the trigger is an event | Jones Day (Apr 2025); Mayer Brown (Jun 2025) |
| Fortis Advisors v. Medtronic | Del. Ch., Jul 29 2024 | Milestone-based, $100m | No — **flagged**: the summaries describe it as milestone-shaped, and whether any leg is a plain numeric threshold is not clear from them. Counted as a milestone, which is the reading least favourable to this model | Jones Day (Apr 2025) |
| Lazard Tech. Partners v. QinetiQ | Del., Apr 23 2015 | "Up to $40m", tiered | No — tiered payout | the clause file's own provenance |
| Winshall v. Viacom (Harmonix) | Del. Ch. 2011, aff'd 2013 | 3.5x the excess over a threshold that rises between periods | No — formula payout, moving target | the clause file's own provenance |
| In re SwervePay Acquisition | Del. Ch., Jul 31 2026 | "Up to $53.75m" pro-rated against a payment-volume baseline | No — pro-rated formula | the clause file's own provenance |

**Two of nine.** The shape this model serves — one metric, one fixed target per period, a tranche
that either falls due or does not — accounts for two of the nine public disputes, and only one of
those two has figures public enough to actually run. Four are event milestones. Three are tiered
or formula payouts.

Three things follow, and the first is the uncomfortable one.

**This is a litigated sample, not a market sample.** Cases reach court because something about them
was arguable. An all-or-nothing cliff either clears or it does not, which is the easiest kind to
settle without suing; a milestone that turns on "commercially reasonable efforts" is the hardest.
So the two-of-nine ratio very likely *understates* how common the cliff structure is in signed
deals, and *overstates* how badly this model fits the market. I cannot correct for that with public
data, and I am not going to pick a flattering number instead. The honest statement is narrower:
**among earnouts that end up in front of a judge, this model addresses two in nine.**

**The refusals are not one problem, they are two.** Event milestones need a different attestation —
somebody who signs that a thing happened, which a bank does not do. Tiered and formula payouts need
the same attestation and a different computation. Those are separate pieces of work, and only the
second is a change to the signed terms. Bundling them as "extend the model" would have hidden that.

**It sharpens who to ask.** If the goal is one practitioner clause that compiles, asking a
life-sciences deal lawyer is asking someone whose earnouts are milestone-shaped by default. The
clause most likely to fit comes from a services or distribution deal in the lower middle market,
where the metric is EBITDA or revenue and the tranche is a cliff. The outreach list is being
rebuilt around that rather than around who is easiest to find.

Full source titles: Jones Day, "Earnouts in M&A Transactions: Recent Decisions From Delaware"
(Apr 2025); Mayer Brown, "Chancery Court Applies Conditional Probability to Calculate Damages in
an Earnout Dispute" (Jun 2025). The four cases replayed above carry their own provenance inside
`replay/clauses/`, at more length than a table row allows.

One claim was looked at and dropped rather than used: a secondary write-up asserts that tiered
payouts produce fewer disputes than cliffs, which would cut against this design. Potter Anderson's
own note on drafting earnouts to manage litigation risk does not say it, so it is not repeated
here. It remains an open question and a fair one to ask.
