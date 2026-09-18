import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url)); // app/docs
const RAW_DIR = path.join(ROOT, 'demo', 'raw');
const FAILURE_SHOT = path.join(ROOT, 'demo', 'recording-failure.png');
const TARGET_URL = 'http://localhost:8090?lang=en';

await fs.mkdir(RAW_DIR, { recursive: true });

const browser = await chromium.launch({ headless: false, slowMo: 250 });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: RAW_DIR, size: { width: 1440, height: 900 } },
  deviceScaleFactor: 2,
  colorScheme: 'dark',
});
const page = await context.newPage();
const video = page.video();

const hold = (milliseconds) => page.waitForTimeout(milliseconds);

async function waitContains(selector, expected, timeout = 30000) {
  const needles = Array.isArray(expected) ? expected : [expected];
  await page.waitForFunction(
    ({ selector, needles }) => {
      const text = document.querySelector(selector)?.textContent ?? '';
      return needles.every((needle) => text.includes(needle));
    },
    { selector, needles },
    { timeout },
  );
}

async function waitButton(nameRe, timeout = 30000) {
  const button = page.getByRole('button', { name: nameRe }).first();
  await button.waitFor({ state: 'visible', timeout });
  await page.waitForFunction(
    (source) => {
      const re = new RegExp(source);
      return [...document.querySelectorAll('button')]
        .some((el) => re.test(el.textContent ?? '') && !el.disabled);
    },
    nameRe.source,
    { timeout },
  );
  return button;
}

async function act(step, nameRe, consequence, holdMs) {
  console.log(`STEP ${step}`);
  const button = await waitButton(nameRe);
  await button.click();
  await consequence();
  await hold(holdMs);
}

async function setBankValues(quarter, metric, oneOff) {
  await waitContains('#bq', String(quarter));
  await page.locator('#bmv').fill(metric);
  await page.locator('#boo').fill(oneOff);
}

async function signQuarter(quarter, metric, oneOff, holdMs = 1500) {
  await setBankValues(quarter, metric, oneOff);
  await act(
    `${quarter === 1 ? '4' : `${quarter === 2 ? '6a' : quarter === 3 ? '7a' : '10a'}`} — bank signs Q${quarter}`,
    /Sign & issue account snapshot/,
    () => waitContains('#p-buyer', [`Bank-signed metric`, `Q${quarter}`]),
    holdMs,
  );
}

async function submitQuarter(quarter, expected, holdMs) {
  await act(
    `${quarter === 1 ? '5' : quarter === 2 ? '6b' : quarter === 3 ? '7b' : '10b'} — submit Q${quarter}`,
    new RegExp(`Submit Q${quarter}`),
    async () => {
      await waitContains('#p-seller', [`Q${quarter} verdict`, expected]);
      await waitContains('#p-arbiter', [`Q${quarter} verdict`, expected]);
    },
    holdMs,
  );
}

let failure;
try {
  console.log('STEP 1 — load English demo');
  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });
  await waitContains('#status', 'LocalNet connected');
  await waitContains('#deal', [
    '24%',
    '28% of them end in dispute',
    'controlled by the buyer',
    'locks the adjudication logic, data source, and arbiter at signing',
  ]);
  await hold(4000);

  await act(
    '2 — propose earnout',
    /Propose earnout/,
    async () => {
      await waitContains('#p-seller', ['Proposal', 'awaiting Seller']);
      await waitButton(/Accept — lock terms/);
    },
    1500,
  );

  await act(
    '3 — seller accepts and locks terms',
    /Accept — lock terms/,
    async () => {
      await waitContains('#deal', 'Terms locked');
      await waitContains('#p-buyer', 'Q1 pending');
    },
    3000,
  );

  await signQuarter(1, '92000000.0', '0.0', 1500);
  await submitQuarter(1, 'MET', 2000);

  await signQuarter(2, '86000000.0', '0.0', 1200);
  await submitQuarter(2, 'MET', 1500);

  await signQuarter(3, '51000000.0', '30000000.0', 1200);
  await submitQuarter(3, 'suppression suspected', 4000);

  await act(
    '8 — seller raises dispute',
    /Raise dispute/,
    async () => {
      await waitContains('#p-arbiter', ['Dispute', 'only the arbiter accesses the raw basis']);
      await waitButton(/Resolve: MET/);
    },
    2000,
  );

  await act(
    '9 — arbiter resolves Q3 as MET',
    /Resolve: MET/,
    async () => {
      await waitContains('#p-seller', ['Q3 verdict', 'MET', '(arbiter-resolved)']);
      await waitContains('#p-arbiter', ['Q3 verdict', 'MET', '(arbiter-resolved)']);
    },
    3000,
  );

  await signQuarter(4, '79000000.0', '0.0', 1200);
  await submitQuarter(4, 'NOT MET', 2000);

  await act(
    '11 — forgery attempt is rejected',
    /Forgery attempt/,
    async () => {
      const banner = page.locator('#banner');
      await banner.waitFor({ state: 'visible', timeout: 30000 });
      await waitContains('#banner', 'The ledger rejected the forgery');
      await waitContains('#log', ['✗ forge', 'requires authorizers', 'EBuyer::']);
      await banner.scrollIntoViewIfNeeded();
    },
    5000,
  );

  await act(
    '12 — seller finalizes 3-of-4',
    /Finalize \(4\/4\)/,
    async () => {
      await waitContains('#p-buyer', ['Settlement obligation', '400M']);
      await waitContains('#deal', ['3 met', 'awaiting Buyer']);
    },
    2000,
  );

  await act(
    '13 — bank mints CashToken',
    /Mint 400M CashToken/,
    async () => {
      await waitContains('#p-buyer', ['CashToken', '400M', 'owner: EBuyer']);
      await waitButton(/Settle — token transfer/);
    },
    1500,
  );

  await act(
    '14 — atomic token transfer and closure',
    /Settle — token transfer/,
    async () => {
      await waitContains('#p-buyer', ['Closed', 'SETTLED']);
      await waitContains('#p-seller', ['CashToken', 'owner: ESeller', 'Closed']);
    },
    4000,
  );

  console.log('STEP 15 — final three-party view');
  await page.locator('.grid').evaluate((el) => el.scrollIntoView({ block: 'start', behavior: 'smooth' }));
  await hold(1000);
  const arbiterText = await page.locator('#p-arbiter').innerText();
  if (arbiterText.includes('CashToken') || arbiterText.includes('Settlement obligation')) {
    throw new Error('Arbiter unexpectedly sees CashToken or settlement obligation');
  }
  await hold(5000);
} catch (error) {
  failure = error;
  const logText = await page.locator('#log').innerText().catch(() => '(log unavailable)');
  console.error(`RECORDING FAILED: ${error.stack || error}`);
  console.error(`\n#log contents:\n${logText}`);
  await page.screenshot({ path: FAILURE_SHOT, fullPage: true }).catch(() => {});
} finally {
  await context.close();
  await browser.close();
}

const rawPath = await video.path();
console.log(`RAW_VIDEO=${rawPath}`);

if (failure) process.exitCode = 1;
