// Finds a Chromium to drive: local playwright-core + Brave on the dev machine, playwright in CI.
import { createRequire } from 'node:module';
import fs from 'node:fs';

const require = createRequire(import.meta.url);

const LOCAL_CORE = process.env.HOME + '/work/webform/node_modules/playwright-core';
const BRAVE = '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser';

export async function launch() {
  let chromium;
  try { ({ chromium } = require('playwright')); }
  catch { ({ chromium } = require(LOCAL_CORE)); }
  const opts = { headless: true };
  if (fs.existsSync(BRAVE) && !process.env.CI) opts.executablePath = BRAVE;
  return chromium.launch(opts);
}
