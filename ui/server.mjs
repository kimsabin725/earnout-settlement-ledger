// Earnout Settlement Ledger — demo backend (zero-dep Node)
// LocalNet JSON Ledger API v2 프록시 + 파티 온보딩 + 정적 UI 서빙
// 실행: node server.mjs   (기본 포트 8090)
import { createServer } from "node:http";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PORT = process.env.PORT || 8090;
const API = "http://localhost:3975"; // app-provider participant JSON API
const KC = "http://keycloak.localhost:8082/realms/AppProvider/protocol/openid-connect/token";
const DAR = join(dirname(fileURLToPath(import.meta.url)), "../ledger/.daml/dist/earnout-ledger-0.0.6.dar");
const TPL = "#earnout-ledger:Earnout";

// ---- LocalNet 자격증명 (splice-onboarding 컨테이너 env에서 1회 취득) ----
const cenv = (k) => execFileSync("docker", ["exec", "splice-onboarding", "printenv", k]).toString().trim();
const CLIENT_ID = cenv("AUTH_APP_PROVIDER_VALIDATOR_CLIENT_ID");
const CLIENT_SECRET = cenv("AUTH_APP_PROVIDER_VALIDATOR_CLIENT_SECRET");
const USER_ID = cenv("AUTH_APP_PROVIDER_VALIDATOR_USER_ID");

// ---- 토큰 캐시 ----
let tok = { v: null, exp: 0 };
async function token() {
  if (tok.v && Date.now() < tok.exp - 30_000) return tok.v;
  const r = await fetch(KC, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: CLIENT_ID, client_secret: CLIENT_SECRET, scope: "openid" }),
  }).then((r) => r.json());
  tok = { v: r.access_token, exp: Date.now() + r.expires_in * 1000 };
  return tok.v;
}
async function api(path, opts = {}) {
  const t = await token();
  const r = await fetch(API + path, { ...opts, headers: { authorization: `Bearer ${t}`, "content-type": opts.body?.constructor === Object ? "application/json" : opts.ctype || "application/json", ...opts.headers } , body: opts.body?.constructor === Object ? JSON.stringify(opts.body) : opts.body });
  const text = await r.text();
  let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!r.ok) throw Object.assign(new Error(json.cause || text.slice(0, 300)), { status: r.status, detail: json });
  return json;
}

// ---- 부트스트랩: DAR 업로드 + 파티 4개 + 권한 ----
const PARTIES = {}; // role -> partyId
async function bootstrap() {
  try { await api("/v2/packages", { method: "POST", ctype: "application/octet-stream", body: readFileSync(DAR) }); console.log("DAR uploaded"); }
  catch (e) { console.log("DAR upload:", e.status, e.message.slice(0, 120)); }
  const existing = await api("/v2/parties");
  const list = existing.partyDetails ?? existing;
  const find = (hint) => (Array.isArray(list) ? list : []).map((p) => p.party).find((p) => p?.startsWith(hint + "::"));
  for (const role of ["EBuyer", "ESeller", "EArbiter", "EBank"]) {
    let p = find(role);
    if (!p) p = (await api("/v2/parties", { method: "POST", body: { partyIdHint: role, displayName: role, identityProviderId: "" } })).partyDetails.party;
    PARTIES[role] = p;
    await api(`/v2/users/${USER_ID}/rights`, { method: "POST", body: { userId: USER_ID, identityProviderId: "", rights: [
      { kind: { CanActAs: { value: { party: p } } } }, { kind: { CanReadAs: { value: { party: p } } } } ] } }).catch(() => {});
  }
  console.log("parties ready:", Object.keys(PARTIES).map((k) => k).join(", "));
}

// ---- 커맨드 제출 ----
const wildcard = { cumulative: [{ identifierFilter: { WildcardFilter: { value: { includeCreatedEventBlob: false } } } }] };
async function submit(actAs, commands, label) {
  const body = {
    commands: {
      commands, workflowId: "earnout-ui", applicationId: USER_ID,
      commandId: `ui-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      deduplicationPeriod: { Empty: {} }, actAs, readAs: Object.values(PARTIES),
      submissionId: `ui-${label}`, disclosedContracts: [], domainId: "", packageIdSelectionPreference: [],
    },
    transactionFormat: { eventFormat: { filtersByParty: Object.fromEntries(Object.values(PARTIES).map((p) => [p, wildcard])), verbose: false }, transactionShape: "TRANSACTION_SHAPE_ACS_DELTA" },
  };
  const r = await api("/v2/commands/submit-and-wait-for-transaction", { method: "POST", body });
  const created = (r.transaction?.events ?? []).map((e) => e.CreatedTreeEvent?.value ?? e.CreatedEvent ?? e.created).filter(Boolean)
    .map((c) => ({ contractId: c.contractId, templateId: c.templateId, args: c.createArgument }));
  return { created };
}

// ---- 파티별 ACS (같은 원장, 다른 가시성의 근거) ----
async function acs(party) {
  const { offset } = await api("/v2/state/ledger-end");
  const rows = await api("/v2/state/active-contracts", { method: "POST", body: { filter: { filtersByParty: { [party]: wildcard } }, verbose: false, activeAtOffset: offset } });
  return (Array.isArray(rows) ? rows : []).map((r) => r.contractEntry?.JsActiveContract?.createdEvent).filter(Boolean)
    .filter((c) => c.templateId.includes(":Earnout:"))
    .map((c) => ({ contractId: c.contractId, template: c.templateId.split(":").pop(), args: c.createArgument }));
}

// ---- HTTP 라우팅 ----
const roleParty = (role) => PARTIES[{ buyer: "EBuyer", seller: "ESeller", arbiter: "EArbiter", bank: "EBank" }[role]];
const routes = {
  "GET /api/parties": async () => ({ parties: PARTIES }),
  "GET /api/state": async (q) => ({ party: roleParty(q.role), contracts: await acs(roleParty(q.role)) }),
  "POST /api/propose": async (_q, b) => submit([roleParty("buyer")], [{ CreateCommand: { templateId: `${TPL}:EarnoutProposal`, createArguments: {
    buyer: roleParty("buyer"), seller: roleParty("seller"), arbiter: roleParty("arbiter"), attestor: roleParty("bank"),
    terms: { dealId: `DEAL-${Date.now()}`, metricName: b.metricName, quarterlyTarget: String(b.quarterlyTarget), totalQuarters: String(b.totalQuarters), requiredMet: String(b.requiredMet), trancheAmount: String(b.trancheAmount) } } } }], "propose"),
  "POST /api/accept": async (_q, b) => submit([roleParty("seller")], [{ ExerciseCommand: { templateId: `${TPL}:EarnoutProposal`, contractId: b.contractId, choice: "Accept", choiceArgument: {} } }], "accept"),
  "POST /api/submit-quarter": async (_q, b) => submit([roleParty("buyer")], [{ ExerciseCommand: { templateId: `${TPL}:EarnoutAgreement`, contractId: b.agreementId, choice: "SubmitQuarter", choiceArgument: { attestationCid: b.attestationId } } }], "quarter"),
  "POST /api/attest": async (_q, b) => {
    const acsB = await acs(roleParty("buyer"));
    const agr = acsB.find((c) => c.template === "EarnoutAgreement");
    if (!agr) throw Object.assign(new Error("no active agreement to attest for"), { status: 422 });
    const q = String(b.quarter ?? agr.args.nextQuarter);
    return submit([roleParty("bank")], [{ CreateCommand: { templateId: `${TPL}:MetricAttestation`, createArguments: {
      dealId: agr.args.terms.dealId, attestor: roleParty("bank"), buyer: roleParty("buyer"),
      quarter: q, metricValue: String(b.metricValue), oneOffOutflows: String(b.oneOffOutflows || "0.0"),
      basisHash: `sha256:acct-snapshot-q${q}` } } }], "attest");
  },
  "POST /api/dispute": async (_q, b) => submit([roleParty("seller")], [{ ExerciseCommand: { templateId: `${TPL}:QuarterVerdict`, contractId: b.contractId, choice: "RaiseDispute", choiceArgument: {} } }], "dispute"),
  "POST /api/resolve": async (_q, b) => submit([roleParty("arbiter")], [{ ExerciseCommand: { templateId: `${TPL}:Dispute`, contractId: b.disputeId, choice: "Resolve", choiceArgument: { verdictCid: b.verdictId, resolvedMet: !!b.resolvedMet, reasoning: b.reasoning || "" } } }], "resolve"),
  "POST /api/finalize": async (_q, b) => submit([roleParty("seller")], [{ ExerciseCommand: { templateId: `${TPL}:EarnoutAgreement`, contractId: b.agreementId, choice: "Finalize", choiceArgument: { verdictCids: b.verdictIds } } }], "finalize"),
  "POST /api/mint": async (_q, b) => submit([roleParty("bank")], [{ CreateCommand: { templateId: `${TPL}:CashToken`, createArguments: { issuer: roleParty("bank"), owner: roleParty("buyer"), amount: String(b.amount) } } }], "mint"),
  "POST /api/settle": async (_q, b) => submit([roleParty("buyer")], [{ ExerciseCommand: { templateId: `${TPL}:SettlementObligation`, contractId: b.obligationId, choice: "Settle", choiceArgument: { tokenCid: b.tokenId } } }], "settle"),
  // 위조 데모: buyer 단독 verdict 생성 시도 — 반드시 실패해야 정상
  "POST /api/forge": async () => submit([roleParty("buyer")], [{ CreateCommand: { templateId: `${TPL}:QuarterVerdict`, createArguments: {
    dealId: "FORGED", buyer: roleParty("buyer"), seller: roleParty("seller"), arbiter: roleParty("arbiter"), quarter: "4",
    metricValue: "99000000.0", oneOffOutflows: "0.0", basisHash: "sha256:forged", met: true, flagged: false, resolution: null } } }], "forge"),
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://x`);
  const key = `${req.method} ${url.pathname}`;
  try {
    if (routes[key]) {
      let body = {};
      if (req.method === "POST") {
        const chunks = []; for await (const c of req) chunks.push(c);
        body = chunks.length ? JSON.parse(Buffer.concat(chunks)) : {};
      }
      const out = await routes[key](Object.fromEntries(url.searchParams), body);
      res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(out));
    } else if (url.pathname === "/" || url.pathname === "/index.html") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(readFileSync(join(dirname(fileURLToPath(import.meta.url)), "index.html")));
    } else res.writeHead(404).end("not found");
  } catch (e) {
    res.writeHead(e.status === 400 || e.status === 409 ? 422 : 500, { "content-type": "application/json" })
      .end(JSON.stringify({ error: e.message, detail: e.detail?.cause || e.detail?.code || null }));
  }
});

await bootstrap();
server.listen(PORT, () => console.log(`Earnout demo UI → http://localhost:${PORT}`));
