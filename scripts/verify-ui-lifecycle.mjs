// UI 렌더링 로직을 실제 LocalNet API 데이터로 전 생애주기 단계별 실행해 검증한다.
// 실행: node scripts/verify-ui-lifecycle.mjs  (LocalNet + server.mjs 가동, clean ledger 전제)
// DOM은 최소 스텁, 페이지 스크립트는 수정 없이 그대로 eval. 검증 후 원장은 더러워지므로 촬영 전엔 리셋 필요.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(path.join(APP, "ui", "index.html"), "utf8");
const script = html.slice(html.indexOf("<script>") + 8, html.lastIndexOf("</script>"));

// ---- DOM 스텁 ----
const nodes = {};
const mk = (id) => nodes[id] ??= { id, innerHTML: "", textContent: "", style: {}, dataset: {}, contains: () => false };
const dataT = [...html.matchAll(/data-t="([a-zA-Z]+)"/g)].map(m => ({ dataset: { t: m[1] }, innerHTML: "" }));
globalThis.document = {
  documentElement: {}, activeElement: null,
  getElementById: mk,
  querySelectorAll: (sel) => sel === "[data-t]" ? dataT : [],
};
globalThis.location = { search: "?lang=en" };
globalThis.setInterval = () => {};
const realFetch = globalThis.fetch;
globalThis.fetch = (u, o) => realFetch(u.startsWith("/") ? "http://localhost:8090" + u : u, o);

// 페이지 스크립트 실행 (refresh() 첫 호출 포함)
const exported = new Function(script + "\n;return { refresh, act };")();
await new Promise(r => setTimeout(r, 300));

// ---- 관찰 헬퍼 ----
const strip = (s) => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
function snapshot(label) {
  const bank = nodes["bform"].style.display === "none"
    ? "완료문구: " + dataT.find(d => d.dataset.t === "bankDone").innerHTML
    : "입력폼 Q" + nodes["bq"].textContent;
  const buttons = (id) => [...nodes[id].innerHTML.matchAll(/<button[^>]*>([^<]*)<\/button>/g)].map(m => m[1].trim()).join(" | ") || "-";
  const stepCur = (nodes["deal"].innerHTML.match(/class="step cur"><span class="dot">([^<]*)</) || [, "(none)"])[1];
  const dealTop = strip(nodes["deal"].innerHTML).slice(0, 70);
  console.log(`\n■ ${label}`);
  console.log(`  stepper 현재: ${stepCur}   | deal: ${dealTop}`);
  console.log(`  bank  : ${bank}`);
  console.log(`  buyer : ${buttons("p-buyer")}`);
  console.log(`  seller: ${buttons("p-seller")}`);
  console.log(`  arbit.: ${buttons("p-arbiter")}`);
  const arbHasMoney = /CashToken|Settlement|Closed/.test(nodes["p-arbiter"].innerHTML);
  if (arbHasMoney) console.log("  ❌ ARBITER 패널에 자금 계약 노출!");
}

// ---- API 드라이버 ----
const api = async (p, b) => (await fetch("/api/" + p, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(b) })).json();
const cid = (r, t) => (r.created || []).find(c => c.templateId.endsWith(":" + t))?.contractId;
const step = async (label, fn) => { const r = fn ? await fn() : null; await exported.refresh(); snapshot(label); return r; };

let R, PROP, AGR, ATT, V3, DISP;
await step("0. 초기 (딜 없음)");
R = await step("1. Propose", () => api("propose", { metricName: "Quarterly Operating Net Cash Flow", quarterlyTarget: "80000000.0", totalQuarters: 4, requiredMet: 3, trancheAmount: "400000000.0" })); PROP = cid(R, "EarnoutProposal");
R = await step("2. Accept", () => api("accept", { contractId: PROP })); AGR = cid(R, "EarnoutAgreement");
for (const [q, mv, oo] of [[1, "92000000.0", "0.0"], [2, "86000000.0", "0.0"], [3, "51000000.0", "30000000.0"]]) {
  R = await step(`3.${q}a Bank attest Q${q}`, () => api("attest", { metricValue: mv, oneOffOutflows: oo })); ATT = cid(R, "MetricAttestation");
  R = await step(`3.${q}b Submit Q${q}`, () => api("submit-quarter", { agreementId: AGR, attestationId: ATT })); AGR = cid(R, "EarnoutAgreement"); if (q === 3) V3 = cid(R, "QuarterVerdict");
}
R = await step("4. Dispute Q3", () => api("dispute", { contractId: V3 })); DISP = cid(R, "Dispute");
await step("5. Arbiter resolve", () => api("resolve", { disputeId: DISP, verdictId: V3, resolvedMet: true, reasoning: "one-off excluded" }));
R = await step("6a. Bank attest Q4", () => api("attest", { metricValue: "79000000.0" })); ATT = cid(R, "MetricAttestation");
R = await step("6b. Submit Q4 (전 분기 완료)", () => api("submit-quarter", { agreementId: AGR, attestationId: ATT })); AGR = cid(R, "EarnoutAgreement");
await step("7. Forge (거부 기대)", async () => { const r = await api("forge", {}); console.log("     forge →", (r.error || "").includes("requires authorizers") ? "✓ requires authorizers" : "❌ " + (r.error || JSON.stringify(r)).slice(0, 80)); return r; });
// finalize에 필요한 verdict id들: buyer ACS에서 수집
const st = await (await fetch("/api/state?role=buyer")).json();
const latest = {}; st.contracts.filter(c => c.template === "QuarterVerdict").forEach(v => latest[v.args.quarter] = v.contractId);
R = await step("8. Finalize (계약 소비!)", () => api("finalize", { agreementId: AGR, verdictIds: Object.values(latest) }));
const OBL = cid(R, "SettlementObligation");
R = await step("9. Mint", () => api("mint", { amount: "400000000.0" })); const TOK = cid(R, "CashToken");
await step("10. Settle (종결)", () => api("settle", { obligationId: OBL, tokenId: TOK }));
console.log("\n=== 검증 종료 ===");
