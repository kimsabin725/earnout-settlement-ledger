# Demo Video Script — 3 minutes (EN)

> 화면: http://localhost:8090?lang=en · 원장 리셋 상태에서 시작 · OBS/QuickTime 녹화

**[0:00–0:20] Problem** (첫 화면의 문제정의 3줄을 보여주며)
"24% of private M&A deals use earnouts. 28% of those end in dispute — because after closing, the books belong to the buyer. The seller can't verify anything. We fix that by locking the adjudication itself at signing."

**[0:20–0:40] Contract** — Propose 클릭 → Seller 패널에서 Accept
"Buyer proposes: 400M tranche, 80M quarterly target, 3 of 4 quarters. Seller accepts — and now the terms, the data source, and the arbiter are fixed. There is no choice in the contract to amend them. Watch the stepper."

**[0:40–1:10] Data source** — Bank 스트립에서 서명·발행 → Buyer가 제출
"Where do the numbers come from? Not the buyer. The bank — already the trusted bookkeeper of the designated account — signs a snapshot. The buyer can only submit bank-signed data. Manual entry isn't rejected by the UI; the choice itself requires an attestation."
(Q1: 92M 충족, Q2: 86M 충족 — 빠르게)

**[1:10–1:50] The dispute** — Q3: metric 51M, one-offs 30M
"Q3 misses the target — but the ledger flags it: excluding a one-off 30M outflow, the target was met. This is THE classic earnout dispute — 'necessary expense' vs 'earnings suppression'. Seller disputes. The arbiter — agreed at signing, seeing no money flow — resolves it as MET, with reasoning recorded on-ledger. What used to take years in court took one flagged quarter."

**[1:50–2:10] The forgery** — 위조 버튼 클릭 → 빨간 배너
"Can the buyer just write a favorable verdict? Watch. The ledger rejects it — a verdict is a dual-signatory contract. This isn't an app rule. It's the authority model of the contract itself."
(Q4: 79M 미충족 — "and an honest miss stays a miss.")

**[2:10–2:40] Settlement** — Finalize → Mint → Settle
"Three of four met. Finalize creates the obligation; Settle transfers the token and closes the deal in ONE atomic transaction. No 'won the judgment, chasing the payment' gap."

**[2:40–3:00] Why Canton** — 세 패널을 가리키며
"Three panels, one ledger, three different views — that's the participant node's actual ACS per party, not UI filtering. On a transparent chain, the acquirer's financials would be public. In a central database, someone owns the record. Here, nobody does — and that's the product. Built solo on Canton with Daml, running on LocalNet."
