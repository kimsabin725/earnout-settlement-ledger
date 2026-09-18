# Season 3 work log

Rule: everything built after Sep 18, 2026 is listed here with the commit hash, so hackathon-period work is identifiable from the pre-hackathon foundation (see README → Status and provenance).

| Date | Commit | What |
|---|---|---|
| 2026-09-18 | `0b6a38c` | Source attribution corrected (ABA study for earnout prevalence, SRS Acquiom for the dispute and collection rates); 11-slide judging deck added under `docs/pitch/`. |
| 2026-09-18 | `ba46b33` | This work log opened; README gained the pre-hackathon / Season 3 split and `docs/validation.md`. |
| 2026-09-18 | `0cd3c12` | GitHub Pages demo page (`docs/index.html`) so the recording plays in the browser instead of downloading; negative-test count stated exactly (5 asserted + 2 unrepresentable). |
| 2026-09-18 | `d2e7e46` | Local absolute paths removed from `docs/record-demo.mjs` and `scripts/verify-ui-lifecycle.mjs` before publishing. |
| 2026-09-18 | `7b8736d` | Replay harness (`replay/`): a written earnout clause compiles into signed terms or is rejected with the reason, then replays its own historical schedule on the ledger and asserts the payout the parties settled on. Three synthetic fixtures; no practitioner clause yet. |
| 2026-09-18 | `5e9bf38` | Three public earnout clauses replayed: Prosser v. PharmaLogic compiles and reproduces its real outcome ($0 paid on a $200,000 shortfall); Lazard v. QinetiQ and Winshall v. Viacom are refused as not expressible. Findings, including what they cost the premise, in `docs/validation.md`. |
| 2026-09-18 | `d48fc04` | Two more public clauses replayed — Fortis/Auris (ten milestones: the trigger is an event, not a figure) and In re SwervePay (a pro-rated "up to" amount across two revenue definitions). Five public clauses now: one fits, four refused. `docs/validation.md` adds the milestone finding and the case this product cannot help with (a baseline misrepresented before signing). |
