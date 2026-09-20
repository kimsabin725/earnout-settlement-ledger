# Demo video — Season 3 cut

**The silent cut runs 3:47; hard limit is 5:00.** English narration, the user's own voice.

The Season 2 winners all shipped a video, and the one currently linked here was recorded on
September 2 — sixteen days before Season 3 opened. A judge watching it sees none of the work this
hackathon was for. This cut fixes that: the ledger footage stays, and everything built since is
put in front of it.

**What needs recording, and what does not.** Only the ledger walkthrough needs Docker and LocalNet,
and that footage already exists and is still accurate — the Daml model has not changed since
August 29, the UI since September 2. Everything new is a terminal and two static pages.

Timecodes below are the assembled cut's, measured — `~/work/hackcanton-video/build/earnout-s3-silent.mp4`.
Each section is padded to its narration plus a fifth, because the first assembly matched on total
length and came out short in five sections out of seven.

| Shot | Source | Needs |
|---|---|---|
| A. Ledger walkthrough | `docs/demo/earnout-demo.mp4` — the **uncaptioned** cut, reused | — |
| B. Harness running | new, screen recording | 8 seconds, no Docker |
| C. Replay page | new, browser | static file |
| D. Self-check | new, browser | static file |
| E. Closing card | new, static | — |

---

## [0:00 – 0:30] The problem, in one breath

*On screen: shot A, first frame — the three panels, paused.*

> An earnout is the part of an acquisition price the seller only gets if the business performs.
> A quarter of private deals use one. Twenty-eight percent of those end in a dispute, and the reason is
> structural: at closing, the books that decide the payout become the buyer's books. The seller
> cannot verify the number. An honest buyer cannot prove it.

`[source: 24% — ABA Private Target Deal Points Study; 28% — SRS Acquiom. Both as cited in docs/validation.md.]`

## [0:30 – 1:29] The ledger, working

*Shot A, full. Use the uncaptioned file: the burned-in captions were written to carry the
silent version, and narrating over them makes the viewer read and listen to two different sentences.*

> So the rules are signed once, at closing, and the ledger runs them.
>
> Buyer and seller co-sign the metric, the target, the attestor and the arbiter. The bank signs each
> quarter's figure — not the buyer.
>
> *(pause — let Q1 and Q2 run)*
>
> Quarter three misses. The ledger flags it, because a one-off outflow would have covered the gap.
> That argument is the classic earnout dispute, and it goes to the arbiter named before there was
> anything to argue about.
>
> Now the buyer tries to write a favourable verdict alone.
>
> *(pause — hold on the rejection banner)*
>
> That rejection is the participant node's, not the app's. A verdict needs both signatures.
>
> Three of four met. Finalization and settlement, one transaction.

## [1:29 – 1:46] The turn

*Shot A freezes. Text over it: "That was a clause I wrote."*

> That proves the mechanism on a clause I wrote myself, which proves very little. The question worth
> asking is whether it holds a clause I did not write. So I went and got some.

## [1:46 – 2:00] Clauses we did not write

*Shot B: terminal. `./replay/run.sh`. Let it run — it takes eight seconds. Then shot C: the replay page,
scrolled to the Prosser card.*

> Five earnout clauses from the Delaware record, each replayed against its own history.
>
> *(pause — let the harness finish)*
>
> Prosser versus PharmaLogic. Six point six million if EBITDA reached seven million. The buyer
> reported six point eight — two hundred thousand short — and nothing was paid.
>
> The ledger reaches the same zero. A real outcome, reproduced by a contract that never saw the case.

`[source: Del. Super. CCLD, Jul 7 2026. Figures and their limits in replay/clauses/case-prosser-pharmalogic.json. The $0 is what the harness computes and what the ledger run reaches.]`

## [2:00 – 2:52] And four that it could not hold

*Shot C, scrolling through the refused cards.*

> Four of the five could not be expressed at all. Tiered payouts. A rising target. FDA milestones,
> where the trigger is an event and not a figure.
>
> Each is published with its reason, because a model widened until everything passes has stopped
> being a test. Counting further: of nine earnout disputes in the public record, two are the shape
> this holds. That is the honest size of it.

`[source: the nine-case survey in docs/validation.md, each row naming where its structure came from. Say "in the public record" and not "in the market" — it is a litigated sample, and the document says why that matters.]`

## [2:52 – 3:22] Ask it about your own clause

*Shot D: the self-check. Answer the milestone path live; the refusal and the "what happened to clauses
shaped like yours" block appear.*

> Which makes one question worth asking anyone who drafts these — would yours have compiled?
>
> Eight questions about the shape of a clause. No figures, no sign-up, nothing leaves the browser:
> the rules read shape, not numbers, so they run in the page. It answers in a line, and tells you
> what happened to the public clauses that look like yours.

## [3:22 – 3:47] What I am not claiming

*Shot E: a plain card, the text appearing line by line.*

> No practitioner has run their own clause through this yet. This runs on LocalNet; DevNet is still
> open. And a clause built on a baseline that was already false at signing is not something a ledger
> can fix.
>
> Everything else can be checked without me. Clone it, and the replays run.

---

## Notes for recording

- **Shot B**: record the terminal at 1280×720, dark theme, font large enough to read at half size.
  Run `./replay/run.sh` once beforehand so the SDK is warm; the take should show the eight-second run,
  not a first-time download.
- **Shot C and D**: `docs/replay.html` and `docs/clause-check.html` open from the filesystem or from
  Pages. Scroll slowly and evenly — the previous recording was re-shot because mouse-wheel scrolling
  stepped visibly at 24fps.
- **Shot D**: answer the *milestone* path, not the compiling one. A refusal explains more than a pass,
  and it is the case four of five real clauses land in.
- **Audio**: one take per section, recorded separately, so a fluffed line costs one section.
- Replace the Demo material's link once the cut is up; the existing 59-second file stays in the
  repository as what it is, the pre-hackathon walkthrough.
