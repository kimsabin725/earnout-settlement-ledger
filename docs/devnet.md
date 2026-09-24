# DevNet deployment — HackCanton shared node

Recorded 2026-09-24T19:35 KST from the node's JSON Ledger API. Every figure on this page was read back from the ledger after the run; the raw responses are kept outside the repository (they carry the tenant's ledger user id and token).

## Where

| | |
|---|---|
| Participant node | `hackcanton-devnet-3` (NODERS shared DevNet, Ledger API 3.5.18) |
| Package | `earnout-ledger` 0.0.6, package id `8ab2c2c315565d0541a093ab38c51b0b53dc8c2ce889fb484a54c5c7886a3ba3` — built with SDK 3.5.2 via dpm, uploaded through the Node Console |
| Party namespace | `bcd80f7b-` (the tenant's prefix; four parties allocated in it) |
| Ledger API | `https://ledger-api-json.participant.hackcanton-01.devnet.naas.noders.services` |

## Parties

| Role | Party |
|---|---|
| ebuyer | `bcd80f7b-ebuyer::12204a9d883d1158141d8f099d06dd2e42cb52615deb42da5a46f042c8d0e1dbdf0e` |
| eseller | `bcd80f7b-eseller::12204a9d883d1158141d8f099d06dd2e42cb52615deb42da5a46f042c8d0e1dbdf0e` |
| earbiter | `bcd80f7b-earbiter::12204a9d883d1158141d8f099d06dd2e42cb52615deb42da5a46f042c8d0e1dbdf0e` |
| ebank | `bcd80f7b-ebank::12204a9d883d1158141d8f099d06dd2e42cb52615deb42da5a46f042c8d0e1dbdf0e` |

Each party was created in the Console and the tenant's ledger user holds `CanActAs` on all four — the same one-user-acts-for-all shortcut the README lists as a known limit. Per-party users remain open.

## The run

`scripts/verify-ui-lifecycle.mjs` was pointed at a demo server started with `LEDGER_API`, `LEDGER_TOKEN`, `LEDGER_USER_ID` and the four `PARTY_*` values above, and driven through the full lifecycle: propose → accept → four quarters of bank attestation and buyer submission → dispute on Q3 → arbiter resolution → a forged submission (refused by the model, as expected) → finalize → mint → settle. It exited 0.

That produced **15 ledger updates** between offsets 1060874 and 1060976:

| Offset | Update id | Events |
|---|---|---|
| 1060874 | `1220dcad7ba4ed72e6c809082fcf96015356569885ded8562a9e30ddce43a1626992` | EarnoutProposal |
| 1060882 | `12202541486e6961958dc47a22b7e629e2d540154db5328b973721f1741896b25b0d` | archived, EarnoutAgreement |
| 1060888 | `122042be1b7caefe70dcbed63b44f59e22dc7da28442ae791b0f2d653915e6a827b1` | MetricAttestation |
| 1060897 | `1220459463daf835a5c0fb3e809d0bd78392a29aaec66dd2ff1f6da76bddeeb0bef8` | archived, archived, QuarterVerdict, EarnoutAgreement |
| 1060903 | `122038913f20846cf35d3f27c3e86b7796dd4df07a9efe34be5a68e82dd87b3a0d92` | MetricAttestation |
| 1060909 | `122056242849c65e469df3dcd55c1dd7304a530d2b2638dc5b4b982636e891e1aa59` | archived, archived, QuarterVerdict, EarnoutAgreement |
| 1060918 | `12209556bf270cceb182a97ef112221556194c9735a16291ccfbbb60dd755b96d1ba` | MetricAttestation |
| 1060924 | `1220c24ec632056fc8ea1a0a92c90040e7b7bdd9d12b6a26a3feb74c3b0c1c1c52a0` | archived, archived, QuarterVerdict, EarnoutAgreement |
| 1060933 | `12200f270e516767d6cef616293122a0769337c001ad6cb861f270fd5c7eead6791e` | Dispute |
| 1060939 | `12201ad0e93824193e37c31669c5da52803c45a341aa15f0c7279888faa9dfb5e2c5` | archived, archived, QuarterVerdict |
| 1060945 | `12209e401c2c83117b2478e933b2ebf3a7343844f33d0c4bed530dda21f59f53ca44` | MetricAttestation |
| 1060954 | `1220d6b144949b0caaf1c0f2ffd69fb045bcfdbcd0bb3c8efdf5d75527ee614ee5e2` | archived, archived, QuarterVerdict, EarnoutAgreement |
| 1060963 | `12209e8e9e24a2a377784e8cc6e5be106abb5f46f91c1f209eea566a2e188e0183ec` | archived, SettlementObligation |
| 1060969 | `12205d69ce3afe74ea33b303d06cd2c40110c323bf4e843a6aef25692d39bdac0c3f` | CashToken |
| 1060976 | `122003efec8401f49fd67e264857396b7ac39a437f3f8344689344edc5297b4a380b` | archived, archived, CashToken, EarnoutClosed |

## What each party can see afterwards

Active contracts per party at ledger end 1060998, read with that party alone in the filter:

| Party | Active `Earnout` contracts |
|---|---|
| ebuyer | 5 — EarnoutClosed, QuarterVerdict |
| eseller | 6 — CashToken, EarnoutClosed, QuarterVerdict |
| earbiter | 4 — QuarterVerdict |
| ebank | 1 — CashToken |

The bank sees one contract; the buyer, seller and arbiter see different subsets of the same deal. That difference is the privacy claim of the model, and it is now observable on a node we do not operate.

## Reproduce

```bash
export LEDGER_API=https://ledger-api-json.participant.hackcanton-01.devnet.naas.noders.services
export LEDGER_TOKEN=<access token from the Keycloak password grant, scope daml_ledger_api>
export LEDGER_USER_ID=<the token's sub>
export PARTY_EBUYER=… PARTY_ESELLER=… PARTY_EARBITER=… PARTY_EBANK=…   # your own namespace
node ui/server.mjs                   # then scripts/verify-ui-lifecycle.mjs against it
```

Getting the token, creating parties and uploading the DAR follow the organisers' quickstart (https://hackmd.io/e3XQxMggRw2m5N7nxzQYZA); none of it needs anyone at NODERS.
