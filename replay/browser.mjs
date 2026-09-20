// Finding a Chromium to drive, wherever this runs.
//
// On the machine this was built on, playwright-core lives beside another tool
// and Brave supplies the browser. In CI neither is true. A test that only runs
// in one place is a test that stops running.
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
