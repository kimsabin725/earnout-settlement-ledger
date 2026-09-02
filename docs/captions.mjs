// 데모 영상 자막 굽기 — ffmpeg 빌드에 drawtext/subtitles가 없어 Playwright로 자막 바 PNG를 렌더 후 overlay.
// 실행: node captions.mjs   (app/docs 에서)  →  demo/earnout-demo-captioned.mp4
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const W = 1440, H = 900, BAR = 96;
const cues = [ // [start, end, text] — 몽타주로 판독한 실제 비트 경계 기준
  [0.0,  5.0, "24% of private M&A deals use earnouts. 28% end in dispute — because the buyer controls the books after closing."],
  [5.0,  8.3, "Buyer proposes: 400M tranche · 80M quarterly target · 3 of 4 quarters."],
  [8.3, 12.0, "Seller accepts. Terms, data source and arbiter are now locked — no choice exists to amend them."],
  [12.0, 17.0, "The numbers don't come from the buyer. The bank signs a snapshot of the designated account —"],
  [17.0, 20.5, "— and the buyer can only submit bank-signed data. Q1, Q2: target met."],
  [20.5, 25.5, "Q3: 51M, below target. The ledger flags it — excluding a one-off 30M outflow, the target was met."],
  [25.5, 30.5, "The classic earnout dispute: necessary expense, or earnings suppression? The seller disputes."],
  [30.5, 34.5, "The arbiter — agreed at signing, blind to the money — resolves it MET. Reasoning is recorded on-ledger."],
  [34.5, 38.0, "Q4: 79M. An honest miss stays a miss."],
  [38.0, 44.0, "Can the buyer forge a verdict? Rejected — a verdict needs both signatures. Authority lives in the contract, not the app."],
  [44.0, 48.5, "Three of four met. Finalize creates the settlement obligation."],
  [48.5, 52.5, "Settle: token transfer and contract closure in ONE atomic transaction."],
  [52.5, 58.9, "One ledger, three views — the arbiter never sees the money. Canton's visibility model, not UI filtering. Solo-built with Daml."],
];

mkdirSync("demo/captions", { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: BAR }, deviceScaleFactor: 1 });
for (let i = 0; i < cues.length; i++) {
  const text = cues[i][2].replace(/&/g, "&amp;").replace(/</g, "&lt;");
  await page.setContent(`<html><body style="margin:0;background:transparent">
    <div style="box-sizing:border-box;width:${W}px;height:${BAR}px;display:flex;align-items:center;justify-content:center;padding:0 90px;
      background:linear-gradient(180deg,rgba(8,10,14,0) 0%,rgba(8,10,14,.88) 28%,rgba(8,10,14,.94) 100%);">
      <div style="font:600 27px/1.3 -apple-system,'Helvetica Neue',Arial,sans-serif;color:#f2f5f8;text-align:center;
        text-shadow:0 1px 2px rgba(0,0,0,.9),0 0 14px rgba(0,0,0,.6);letter-spacing:.1px">${text}</div>
    </div></body></html>`);
  await page.screenshot({ path: `demo/captions/c${String(i).padStart(2, "0")}.png`, omitBackground: true });
}
await browser.close();

// ffmpeg overlay 체인 — 각 자막을 시간 구간에만 표시
const inputs = ["-i", "demo/earnout-demo.mp4"];
let chain = "", prev = "0:v";
cues.forEach((c, i) => {
  inputs.push("-i", `demo/captions/c${String(i).padStart(2, "0")}.png`);
  const out = i === cues.length - 1 ? "vout" : `v${i}`;
  chain += `[${prev}][${i + 1}:v]overlay=0:${H - BAR}:enable='between(t,${c[0]},${c[1]})'[${out}];`;
  prev = out;
});
chain = chain.slice(0, -1);
writeFileSync("demo/captions/filter.txt", chain);
execFileSync("ffmpeg", ["-y", "-v", "error", ...inputs, "-filter_complex", chain, "-map", "[vout]", "-map", "0:a?",
  "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
  "demo/earnout-demo-captioned.mp4"], { stdio: "inherit" });
console.log(`done: ${cues.length} cues → demo/earnout-demo-captioned.mp4`);
