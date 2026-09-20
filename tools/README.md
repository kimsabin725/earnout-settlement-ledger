# tools/

Two checks that run in CI, for the two kinds of mistake no test here could catch.

## `check-borrowed.mjs` — language that came from somewhere else

Reading other people's work is how you learn what a judge rewards. It is also how
three sentences ended up in this repository paraphrased from a previous season's
winning submission, in the same hackathon, with the same judges.

A list of phrases I remembered borrowing found none of them. Comparing five-word
runs found all three — including one I had kept on purpose because it read like a
plain description of Canton. Git settled that one: we had never written it that
way before the day I read it.

The sources are stored as hashed n-grams (`borrowed.json`), not as text. The
check needs to know that a run matches, not what the other document says, and
carrying someone's words in order to prove we are not carrying them would be a
strange way round.

A hit is a place to look, not a verdict — a deal's terms have only so many ways
of being written. Facts like that go in `ALLOW` with the reason.

Adding a source you have read:

```
node tools/fingerprint.mjs "what this is, and when I read it" file.txt
```

and merge the line into `borrowed.json`.

## `check-claims.mjs` — figures with nobody behind them

Everything in these documents is either sourced, computed here, or explicitly not
claimed. One unsourced percentage costs more than it adds, and they arrive
quietly: read somewhere, repeated once, then repeated as ours.

The check reads every paragraph carrying a figure and fails unless the same
paragraph says where it came from — a citation, a link, a file in this
repository, a note that the harness computed it, or a plain statement that it is
not being claimed.

It is deliberately strict about *the same paragraph*. A table three screens up is
not a source to somebody reading one passage.
