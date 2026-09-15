# TASK: Record the Earnout Settlement Ledger demo video

You are automating a browser to record a 3-minute product demo of a Canton/Daml application
that is already built and running locally. **Do not modify the application.** Your only job is
to drive the UI in a specific order and produce a screen recording.

Repo root: `/Users/sbk/Projects/hackcanton-s3`
App: `app/ui/` (backend `server.mjs`, frontend `index.html`)
Deliverable: `app/docs/demo/earnout-demo.webm` (+ `.mp4` if ffmpeg is available)

---

## 0. Preconditions — verify before you start

> **As of 2026-09-02 the environment is already prepared and verified**: LocalNet is running,
> the ledger is clean (`contracts: []`), the backend is on :8090, and the full flow below was
> exercised end-to-end via the API. **If `curl -s "http://localhost:8090/api/state?role=buyer"`
> returns `{"party":"EBuyer::...","contracts":[]}`, skip to §1 and start recording.**
> Only run the commands below if that check fails.

The app needs three things running. Check each; if any is down, bring it up and wait.

```bash
# 1. Docker daemon
docker info >/dev/null 2>&1 || open -a Docker
until docker info >/dev/null 2>&1; do sleep 4; done

# 2. Canton LocalNet (18 containers). Reset the ledger for a clean demo:
export JAVA_HOME="/opt/homebrew/opt/openjdk@17"
export PATH="$HOME/.dpm/bin:$HOME/.local/bin:$JAVA_HOME/bin:$PATH"
cd /Users/sbk/Projects/hackcanton-s3/cn-quickstart/quickstart
make clean-all-docker >/dev/null 2>&1     # wipes ledger volumes — REQUIRED for a clean recording
make start
until docker ps --format '{{.Names}} {{.Status}}' | grep splice-onboarding | grep -q healthy; do sleep 5; done

# 3. Demo backend (uploads DAR, onboards parties, serves UI on :8090)
pkill -f "node server.mjs"; sleep 1
cd /Users/sbk/Projects/hackcanton-s3/app/ui
nohup /opt/homebrew/bin/node server.mjs > /tmp/ui-server.log 2>&1 &
sleep 12
curl -s "http://localhost:8090/api/state?role=buyer"   # must return {"party":"EBuyer::...","contracts":[]}
```

`contracts: []` confirms a clean ledger. If it returns contracts, the reset did not happen — redo step 2.

**Note:** `make clean-all-docker` + `make start` takes ~3–5 minutes. Be patient; poll, don't assume failure.

---

## 1. Recording setup

Use **Playwright with built-in video recording** (no screen-capture permissions needed).

```bash
cd /Users/sbk/Projects/hackcanton-s3/app/docs
mkdir -p demo
npm init -y >/dev/null 2>&1
npm i -D playwright >/dev/null 2>&1
npx playwright install chromium
```

Context options that matter:

```js
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: 'demo/raw', size: { width: 1440, height: 900 } },
  deviceScaleFactor: 2,          // crisp text
  colorScheme: 'dark',
});
```

Launch with `chromium.launch({ headless: false, slowMo: 250 })` — the pacing matters, this is a
demo for humans, not a test.

Target URL: **`http://localhost:8090?lang=en`** (English — this is for an international hackathon).

---

## 2. UI reference

The page is a single HTML file with a 2.5s polling refresh. **All buttons are plain `<button>`
elements identified by their visible text.** Prefer `page.getByRole('button', { name: /.../ })`.

Stable element IDs:

| ID | What |
|---|---|
| `#deal` | Top summary card + lifecycle stepper |
| `#banner` | Red forgery-rejection banner (hidden until triggered) |
| `#bmv` | Bank's metric value input |
| `#boo` | Bank's one-off outflows input |
| `#bq` | Bank's current quarter indicator (text: "1".."4") |
| `#p-buyer` `#p-seller` `#p-arbiter` | The three party panels |
| `#log` | Activity log (green ✓ / red ✗ lines) |
| `#status` | Connection pill |

Button texts (English mode):

| Action | Button text (regex) | Where |
|---|---|---|
| Propose | `/Propose earnout/` | buyer panel |
| Accept | `/Accept — lock terms/` | seller panel |
| Bank signs metric | `/Sign & issue account snapshot/` | bank strip (top) |
| Submit quarter | `/Submit Q\d/` | buyer panel (on the bank-signed metric card) |
| Raise dispute | `/Raise dispute/` | seller panel (only on flagged verdict) |
| Arbiter resolves | `/Resolve: MET/` | arbiter panel |
| Forgery attempt | `/Forgery attempt/` | top bar |
| Finalize | `/Finalize \(4\/4\)/` | seller panel |
| Mint token | `/Mint 400M CashToken/` | bank strip |
| Settle | `/Settle — token transfer/` | buyer panel |

**Critical timing rule:** after every click the UI needs a poll cycle to re-render. Never chain
clicks blindly. After each action, wait for the *expected consequence*:

```js
async function act(page, nameRe, expect) {
  await page.getByRole('button', { name: nameRe }).first().click();
  if (expect) await expect();          // wait for the resulting state
  await page.waitForTimeout(1200);     // let the viewer read it
}
// example consequence check:
await page.waitForFunction(() => document.querySelector('#p-seller').textContent.includes('Q1 verdict'));
```

If a button is not found, the previous step has not settled — wait and re-query, do not force-click.

---

## 3. The demo sequence — follow exactly

Each beat maps to a line in `app/docs/demo-script.md` (the narration script). Hold on the
described moments; the pauses are the point.

| # | Action | Values | Hold | Why it matters |
|---|---|---|---|---|
| 1 | Load `?lang=en`, wait for `#deal` to show the 3-line problem statement | — | **4s** | Establishes the problem: 24% use earnouts, 28% dispute |
| 2 | Click **Propose earnout** | — | 1.5s | Buyer proposes 400M tranche / 80M per quarter / 3-of-4 |
| 3 | Click **Accept — lock terms** | — | **3s** | Terms locked. Point of the hold: stepper advances to "Terms locked" |
| 4 | Fill `#bmv` = `92000000.0`, `#boo` = `0.0` → **Sign & issue account snapshot** | Q1 | 1.5s | Data comes from the BANK, not the buyer |
| 5 | Click **Submit Q1** | — | 2s | Verdict appears in all three panels — MET |
| 6 | Fill `#bmv` = `86000000.0`, `#boo` = `0.0` → sign → **Submit Q2** | Q2 | 1.5s | MET (move briskly) |
| 7 | Fill `#bmv` = `51000000.0`, `#boo` = `30000000.0` → sign → **Submit Q3** | Q3 | **4s** | ⚠️ FLAGGED — misses target, but target met if the one-off is excluded. **This is the classic earnout dispute.** |
| 8 | Click **Raise dispute** (seller panel) | — | 2s | Dispute card appears in the arbiter panel |
| 9 | Click **Resolve: MET** (arbiter panel) | — | **3s** | Verdict flips to MET (arbiter-resolved), reasoning recorded |
| 10 | Fill `#bmv` = `79000000.0`, `#boo` = `0.0` → sign → **Submit Q4** | Q4 | 2s | NOT MET — an honest miss stays a miss |
| 11 | Click **Forgery attempt** (top bar) | — | **5s** | 🛡️ **KILLER SHOT.** Red `#banner` appears: the ledger rejects a buyer-only verdict. Verified ledger response: `requires authorizers EBuyer::… ESeller::…` — i.e. the seller's signature is missing. Make sure the banner is fully visible and held. |
| 12 | Click **Finalize (4/4)** (seller panel) | — | 2s | 3-of-4 met → settlement obligation created |
| 13 | Click **Mint 400M CashToken** (bank strip) | — | 1.5s | Buyer funds the payment |
| 14 | Click **Settle — token transfer** (buyer panel) | — | **4s** | Token transfer + closure in ONE atomic transaction |
| 15 | Scroll so all three panels are visible, hold | — | **5s** | Final beat: same ledger, three different views. Arbiter has NO CashToken/settlement — that is Canton's visibility model, not UI filtering. |

Total ≈ 70–90s of raw footage. That is correct — the narration stretches it to ~3 minutes.

---

## 4. Output

```js
await context.close();   // finalizes the video file
await browser.close();
```

Then:

```bash
cd /Users/sbk/Projects/hackcanton-s3/app/docs
mv demo/raw/*.webm demo/earnout-demo.webm
# optional, if ffmpeg exists:
ffmpeg -y -i demo/earnout-demo.webm -vf "fps=30" -c:v libx264 -pix_fmt yuv420p demo/earnout-demo.mp4
```

Report back with: the output file path, its duration and size, and a note on any beat that did
not render as described in the table.

---

## 5. Rules

- **Do not modify** `app/ledger/`, `app/tests/`, `app/ui/server.mjs`, or `app/ui/index.html`.
  If the UI misbehaves, report it — do not patch it.
- **Do not** run `dpm build`, change model versions, or touch `daml.yaml` files.
- Put the Playwright script at `app/docs/record-demo.mjs` and any npm artifacts under `app/docs/`.
  Do not add `node_modules` to git (already gitignored).
- If a step fails twice, stop and report which step, with the `#log` panel contents and a
  screenshot. Do not improvise an alternative flow — the sequence above is the approved script.
- Optional polish, only if the base recording already succeeded: a second take with
  `slowMo: 400` for a calmer pace.

## 5b. Pre-verified behaviour (2026-09-02, via API)

Each of these was confirmed working against the live LocalNet before this task was written, so if
one fails during recording it is an environment problem, not a missing feature:

- `propose` → `accept` creates `EarnoutAgreement` with `nextQuarter: 1`
- `attest` (bank) → `submit-quarter` (buyer) creates `QuarterVerdict`, agreement re-created with `nextQuarter+1`
- metric 51M with one-off 30M against an 80M target → `flagged: true` (the dispute trigger)
- `dispute` → `resolve` produces a verdict with `resolution: true` (arbiter-resolved)
- `forge` → rejected with `Interpretation error: … requires authorizers EBuyer::… ESeller::…`

## 6. Context (why this exists)

The app demonstrates M&A **earnouts** — deferred payments tied to post-closing performance.
24% of private M&A deals use them; 28% end in dispute, because the post-closing books are
controlled by the buyer. This ledger locks the adjudication logic, the data source (a bank that
signs account snapshots), and the arbiter at signing, so neither side can change them afterward.
The three panels prove Canton's per-party visibility: each renders only what that party's
participant node can actually see.

---

## 7. Changelog — read this if you attempted a take before 2026-09-02

**Take 1 failed at Step 9 (`Resolve: MET`) and the report was correct.** The click did not
produce an `/api/resolve` request. Root cause was a frontend scope bug in `index.html`: the
Dispute card's inline `onclick` referenced `a.verdictQuarter`, a variable local to the `card()`
function, which is undefined at click time in the global handler scope — the handler threw
silently and no request was ever made.

**Fixed** (owner-side, 2026-09-02): the quarter is now interpolated at render time, so the
handler is emitted as `VBYQ['3']` instead of `VBYQ[a.verdictQuarter]`. Verified by rendering
`card()` directly and asserting the emitted handler contains no local-scope references.

Also fixed earlier the same day: the `/api/forge` route was missing the `dealId` and
`oneOffOutflows` fields added in model 0.0.6, so Step 11 was failing with a field-validation
error rather than the intended authorization error.

**What this means for you:** the ledger has been reset and the backend restarted with both
fixes. Re-run the full sequence from Step 1. Steps 1–8 behaved correctly in take 1, so expect
them to pass again; Step 9 onward is now unverified-by-UI territory — if anything else fails,
report it the same way you reported this one. That report was exactly right and saved a broken
demo from being recorded.
