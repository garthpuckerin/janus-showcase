#!/usr/bin/env node
/* Advisor-wizard / Matrix-lookup sweep — modelled on `scripts/mobile-sweep.mjs`
 * but standalone: its own build output (`dist-advisor`), its own preview
 * port (4289), so it can run alongside that script without colliding on a
 * port or a build directory. Builds the app, serves it with
 * `vite preview --strictPort`, and drives Playwright's emulated iPhone 13
 * through the phone Advisor wizard and Matrix lookup. The preview child is
 * always killed in a `finally`.
 *
 * `--self-test` proves the gate can fail: `?view=desktop` forces the
 * workstation shell into `sessionStorage` (`src/utils/surface.js`); a
 * SECOND navigation to `?view=advisor` then keeps that forced shell (the
 * stored choice persists across navigations) while changing the ROUTE to
 * advisor — `?view=desktop&view=advisor` cannot do this in one URL, because
 * `URLSearchParams` collapses a duplicate key to its last value. That two-step
 * navigation is "how the forced desktop layout is addressed for the advisor
 * route" this build brief asks for.
 */
import { spawn } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, devices } from '@playwright/test';
import { MATRIX_ROWS } from '../src/domain/matrix.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const VITE_BIN = join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
const PORT = 4289;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const OUT_DIR = 'dist-advisor';
const SELF_TEST = process.argv.includes('--self-test');

// Explicit, reviewed allowlist for check 4 (inline text links only). Empty:
// every control this build adds (including the lookup's checkbox and the
// tamper radios) is explicitly sized to 44x44 in companion-advisor.css /
// companion-matrix.css, so nothing here needs an exception.
const TOUCH_TARGET_ALLOWLIST = [];

const INTERACTIVE_SELECTOR = 'button, a[href], select, input:not([type=hidden]), textarea, summary, [role="button"]';

function runVite(args) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(process.execPath, [VITE_BIN, ...args], { cwd: ROOT, stdio: 'inherit' });
    child.once('error', rejectRun);
    child.once('exit', (code, signal) => {
      if (code === 0 && signal === null) resolveRun();
      else rejectRun(new Error(`vite ${args.join(' ')} exited with ${signal ? `signal ${signal}` : `code ${code}`}`));
    });
  });
}

function startPreview() {
  return spawn(
    process.execPath,
    [VITE_BIN, 'preview', '--outDir', OUT_DIR, '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'],
    { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] },
  );
}

async function waitForServer(url, timeoutMs = 20000) {
  const startedAt = Date.now();
  for (;;) {
    try {
      await fetch(url);
      return;
    } catch {
      if (Date.now() - startedAt > timeoutMs) throw new Error(`Timed out waiting for ${url}`);
      await new Promise((resolveWait) => setTimeout(resolveWait, 300));
    }
  }
}

/* ---------- Low-level page checks. Each returns {ok, detail}. ---------- */

async function evalNoDesktopChrome(page) {
  const counts = await page.evaluate(() => ({
    sidebar: document.querySelectorAll('.app-sidebar').length,
    topbar: document.querySelectorAll('.app-topbar').length,
    advisorLayout: document.querySelectorAll('.advisor-layout').length,
    advisorWhy: document.querySelectorAll('.advisor-why').length,
    table: document.querySelectorAll('table').length,
  }));
  const ok = Object.values(counts).every((n) => n === 0);
  return { ok, detail: ok ? 'no desktop chrome, no desktop Advisor classes, no <table>' : JSON.stringify(counts) };
}

async function evalBottomTabBar(page, viewportHeight) {
  const tabBar = page.locator('.companion-tabs');
  if ((await tabBar.count()) === 0) return { ok: false, detail: 'no .companion-tabs found' };
  const box = await tabBar.boundingBox();
  if (!box) return { ok: false, detail: '.companion-tabs is not visible' };
  const bottomOk = Math.abs(box.y + box.height - viewportHeight) <= 1;
  const tabs = await page.locator('.companion-tabs__tab').all();
  const undersized = [];
  for (const tab of tabs) {
    const b = await tab.boundingBox();
    if (!b || b.width < 44 || b.height < 44) undersized.push(b ? `${Math.round(b.width)}×${Math.round(b.height)}` : 'hidden');
  }
  const ok = bottomOk && tabs.length > 0 && undersized.length === 0;
  return { ok, detail: ok ? `fixed to viewport bottom, ${tabs.length} tabs ≥44×44` : `bottomEdge=${Math.round(box.y + box.height)}/${viewportHeight} undersized=[${undersized.join(', ')}]` };
}

/** The wizard's action bar sits directly above the tab bar, and — scrolled
 *  to the very bottom — the last piece of step content never hides under it. */
async function evalActionBarClearance(page) {
  const actionBar = page.locator('.wizard-actionbar');
  if ((await actionBar.count()) === 0) return { ok: false, detail: 'no .wizard-actionbar found' };
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(60);

  const barBox = await actionBar.boundingBox();
  const tabBox = await page.locator('.companion-tabs').boundingBox();
  const aboveTabBar = Boolean(barBox) && Boolean(tabBox) && Math.abs(barBox.y + barBox.height - tabBox.y) <= 1;

  const lastBox = await page.locator('.advisor-wizard__screen > *').last().boundingBox();
  const clears = Boolean(lastBox) && Boolean(barBox) && lastBox.y + lastBox.height <= barBox.y + 1;

  const ok = aboveTabBar && clears;
  return {
    ok,
    detail: ok
      ? `actionbar top=${Math.round(barBox.y)} sits on tabbar top=${Math.round(tabBox.y)}; last content bottom=${Math.round(lastBox.y + lastBox.height)}`
      : `aboveTabBar=${aboveTabBar} lastBottom=${lastBox ? Math.round(lastBox.y + lastBox.height) : 'n/a'} barTop=${barBox ? Math.round(barBox.y) : 'n/a'}`,
  };
}

async function evalFirstContentTop(page, viewportHeight, selector) {
  const el = page.locator(selector).first();
  if ((await el.count()) === 0) return { ok: false, detail: `no element for ${selector}` };
  const box = await el.boundingBox();
  const ok = Boolean(box) && box.y <= viewportHeight * 0.35;
  return {
    ok,
    detail: ok
      ? `${selector} top=${Math.round(box.y)}px (≤35% of ${viewportHeight}=${Math.round(viewportHeight * 0.35)})`
      : `${selector} top=${box ? Math.round(box.y) : 'hidden'} vs 35%=${Math.round(viewportHeight * 0.35)}`,
  };
}

async function evalTouchTargets(page, allowlist) {
  const offenders = await page.evaluate(
    ({ selector, allow }) => {
      const found = [];
      for (const el of document.querySelectorAll(selector)) {
        const rect = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        const visible = rect.width > 1 && rect.height > 1 && style.visibility !== 'hidden' && style.display !== 'none';
        if (!visible) continue;
        const className = typeof el.className === 'string' ? el.className : '';
        if (allow.some((cls) => className.split(/\s+/).includes(cls))) continue;
        if (rect.width < 44 || rect.height < 44) {
          found.push(`${el.tagName.toLowerCase()}.${className.trim().split(/\s+/).slice(0, 2).join('.')} ${Math.round(rect.width)}×${Math.round(rect.height)}`);
        }
      }
      return found;
    },
    { selector: INTERACTIVE_SELECTOR, allow: allowlist },
  );
  return { ok: offenders.length === 0, detail: offenders.length ? offenders.slice(0, 8).join('; ') : 'every visible interactive target ≥44×44' };
}

async function evalLayoutHygiene(page, viewportWidth) {
  const problems = await page.evaluate((width) => {
    const found = [];
    if (document.querySelector('table')) found.push('a <table> is rendered');
    if (document.documentElement.scrollWidth > width + 1) {
      found.push(`page is wider than the viewport (${document.documentElement.scrollWidth} > ${width})`);
    }
    if (Math.abs(document.body.scrollHeight - document.documentElement.scrollHeight) > 1) {
      found.push(`body.scrollHeight (${document.body.scrollHeight}) != documentElement.scrollHeight (${document.documentElement.scrollHeight})`);
    }
    for (const el of document.querySelectorAll('body *')) {
      const rect = el.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) continue;
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.position === 'fixed') continue;
      if (rect.right > width + 1) {
        found.push(`renders past the viewport edge (right=${Math.round(rect.right)} of ${width}): ${el.tagName.toLowerCase()}`);
        break;
      }
    }
    for (const el of document.querySelectorAll('*')) {
      const style = getComputedStyle(el);
      if (/(auto|scroll)/.test(style.overflowX) && el.scrollWidth > el.clientWidth + 1) {
        found.push(`sideways-scrolling element: ${el.tagName.toLowerCase()}.${(typeof el.className === 'string' ? el.className : '').slice(0, 30)}`);
      }
    }
    for (const el of document.querySelectorAll('*')) {
      if (el === document.documentElement || el === document.body) continue;
      const style = getComputedStyle(el);
      if (/(auto|scroll)/.test(style.overflowY) && el.scrollHeight > el.clientHeight + 1) {
        found.push(`nested vertical scroller: ${el.tagName.toLowerCase()}.${(typeof el.className === 'string' ? el.className : '').slice(0, 30)}`);
      }
    }
    return found;
  }, viewportWidth);
  return { ok: problems.length === 0, detail: problems.length ? problems.slice(0, 6).join('; ') : 'no table, no overflow, document is the only scroller' };
}

async function evalOneStepRendered(page) {
  const count = await page.locator('.advisor-wizard__screen').count();
  return { ok: count === 1, detail: `${count} .advisor-wizard__screen container(s) rendered` };
}

/* ---------- Normal sweep ---------- */

const outcomes = [];
function record(id, { ok, detail }) {
  outcomes.push({ id, status: ok ? 'pass' : 'fail', detail });
}

async function openEveryDetailsAndCheckHygiene(page, label, viewportWidth) {
  const summaries = await page.locator('details summary').all();
  for (let i = 0; i < summaries.length; i += 1) {
    await summaries[i].click();
    await page.waitForTimeout(30);
    record(`5 · ${label}: layout hygiene with details #${i + 1} open`, await evalLayoutHygiene(page, viewportWidth));
    await summaries[i].click();
    await page.waitForTimeout(30);
  }
}

async function checkWizardStep(page, label, viewport) {
  record(`1 · ${label}: no desktop chrome, no table`, await evalNoDesktopChrome(page));
  record(`3 · ${label}: first content in top 35%`, await evalFirstContentTop(page, viewport.height, '.advisor-wizard__screen'));
  record(`4 · ${label}: every interactive target ≥44×44`, await evalTouchTargets(page, TOUCH_TARGET_ALLOWLIST));
  record(`5 · ${label}: layout hygiene`, await evalLayoutHygiene(page, viewport.width));
  record(`6 · ${label}: exactly one step rendered`, await evalOneStepRendered(page));
  await openEveryDetailsAndCheckHygiene(page, label, viewport.width);
}

async function runAdvisorWizardChecks(browser) {
  const iphone = devices['iPhone 13'];
  const context = await browser.newContext({ ...iphone });
  const page = await context.newPage();
  const viewport = iphone.viewport;

  // ---- Step 1: Ask ----
  await page.goto(`${BASE_URL}/?view=advisor`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(150);
  await checkWizardStep(page, 'Advisor step 1 (Ask)', viewport);
  record('2 · Advisor: bottom tab bar fixed + ≥44×44 tabs', await evalBottomTabBar(page, viewport.height));
  record('2 · Advisor: action bar sits above the tab bar, clears last content', await evalActionBarClearance(page));

  // ---- Step 2: Result (needs-input default port mints a continuation) ----
  await page.locator('.wizard-actionbar__primary').click();
  await page.waitForTimeout(150);
  await checkWizardStep(page, 'Advisor step 2 (Result)', viewport);

  // ---- Step 3: Continuation ----
  await page.locator('.wizard-actionbar__primary').click();
  await page.waitForTimeout(100);
  await checkWizardStep(page, 'Advisor step 3 (Continuation)', viewport);

  // ---- Step 4: Clarify ----
  await page.locator('.wizard-actionbar__primary').click();
  await page.waitForTimeout(100);
  await checkWizardStep(page, 'Advisor step 4 (Clarify)', viewport);

  // ---- Step 5: Result (clarify's default port is "advice-above-floor") ----
  await page.locator('.wizard-actionbar__primary').click();
  await page.waitForTimeout(150);
  await checkWizardStep(page, 'Advisor step 5 (Result)', viewport);

  const step5Directive = await page.locator('.wizard-result__chip .directive-chip').innerText();
  record('7 · needs-input path reaches step 5 and ends in ADVISE', {
    ok: step5Directive.includes('ADVISE'),
    detail: `step 5 directive chip reads "${step5Directive.trim()}"`,
  });

  await context.close();
}

async function runAdviceFirstPath(browser) {
  const iphone = devices['iPhone 13'];
  const context = await browser.newContext({ ...iphone });
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/?view=advisor`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(150);
  await page.selectOption('#wizard-ask-port', 'advice-above-floor');
  await page.locator('.wizard-actionbar__primary').click();
  await page.waitForTimeout(150);

  const primaryLabel = (await page.locator('.wizard-actionbar__primary').innerText()).trim();
  const stepCount = await page.locator('.advisor-wizard__screen').count();
  record('7 · advice-first path ends at step 2 with "Start over"', {
    ok: primaryLabel === 'Start over' && stepCount === 1,
    detail: `primary action reads "${primaryLabel}", ${stepCount} step container(s)`,
  });

  await context.close();
}

async function runTamperMode(browser, tamperKey) {
  const iphone = devices['iPhone 13'];
  const context = await browser.newContext({ ...iphone });
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/?view=advisor`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(150);
  await page.locator('.wizard-actionbar__primary').click(); // -> step 2
  await page.waitForTimeout(100);
  await page.locator('.wizard-actionbar__primary').click(); // -> step 3
  await page.waitForTimeout(100);
  await page.locator('.wizard-actionbar__primary').click(); // -> step 4
  await page.waitForTimeout(100);

  await page.getByText('Advanced: tamper with the continuation').click();
  await page.locator(`input[name="wizard-tamper"][value="${tamperKey}"]`).check();
  await page.locator('.wizard-actionbar__primary').click(); // submit clarify -> step 5
  await page.waitForTimeout(150);

  const directive = (await page.locator('.wizard-result__chip .directive-chip').innerText()).trim();
  const bannerVisible = await page.getByText(/model was not called/i).count();
  record(`7 · tamper mode "${tamperKey}" ends in REQUEST_INPUT with "model was not called" visible`, {
    ok: directive.includes('REQUEST_INPUT') && bannerVisible > 0,
    detail: `directive="${directive}" bannerFound=${bannerVisible > 0}`,
  });

  await context.close();
}

async function runMatrixLookupChecks(browser) {
  const iphone = devices['iPhone 13'];
  const context = await browser.newContext({ ...iphone });
  const page = await context.newPage();
  const viewport = iphone.viewport;

  await page.goto(`${BASE_URL}/?view=matrix`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(150);

  record('1 · Matrix lookup: no desktop chrome, no table', await evalNoDesktopChrome(page));
  // A lookup's content is its ANSWER. The first version of this check pointed
  // at the controls and passed while the result card was cut off at the bottom
  // of the first screen — a dropdown is not "content".
  record('3 · Matrix lookup: the result is in the top 35%', await evalFirstContentTop(page, viewport.height, '.matrix-lookup__dock'));
  {
    const dock = await page.locator('.matrix-lookup__dock').boundingBox();
    const firstControl = await page.locator('#matrix-lookup-route').boundingBox();
    const ok = Boolean(dock && firstControl)
      && dock.y + dock.height <= viewport.height * 0.5
      && firstControl.y + firstControl.height <= viewport.height;
    record('3 · Matrix lookup: result fully in the top half, first control on the first screen', {
      ok,
      detail: dock && firstControl
        ? `resultBottom=${Math.round(dock.y + dock.height)} firstControlBottom=${Math.round(firstControl.y + firstControl.height)} of ${viewport.height}`
        : 'dock or first control not found',
    });
  }
  // …and it stays in view after scrolling to the last control.
  {
    await page.locator('.matrix-lookup__presets').scrollIntoViewIfNeeded();
    const dock = await page.locator('.matrix-lookup__dock').boundingBox();
    const ok = Boolean(dock) && dock.y >= 0 && dock.y + dock.height <= viewport.height;
    record('3 · Matrix lookup: the result stays docked while the inputs scroll', {
      ok,
      detail: dock ? `dockTop=${Math.round(dock.y)} dockBottom=${Math.round(dock.y + dock.height)}` : 'dock not found',
    });
    await page.evaluate(() => window.scrollTo(0, 0));
  }
  record('4 · Matrix lookup: every interactive target ≥44×44', await evalTouchTargets(page, TOUCH_TARGET_ALLOWLIST));
  record('5 · Matrix lookup: layout hygiene', await evalLayoutHygiene(page, viewport.width));
  await openEveryDetailsAndCheckHygiene(page, 'Matrix lookup', viewport.width);

  // 8a: absent route + participation "none" is registry-invalid, no chip.
  await page.selectOption('#matrix-lookup-route', 'absent');
  await page.selectOption('#matrix-lookup-participation', 'none');
  await page.waitForTimeout(60);
  const invalidStateVisible = await page.getByText('Not a registry-valid combination').count();
  const chipWhenInvalid = await page.locator('.matrix-lookup__chip .directive-chip').count();
  record('8 · absent route + "none" participation shows registry-invalid, no chip', {
    ok: invalidStateVisible > 0 && chipWhenInvalid === 0,
    detail: `invalidStateVisible=${invalidStateVisible > 0} chipCount=${chipWhenInvalid}`,
  });

  // 8b: the two canonical-policy presets each produce a directive chip.
  const presetButtons = await page.locator('.matrix-lookup__presets button').all();
  let allPresetsResolved = presetButtons.length > 0;
  for (const button of presetButtons) {
    await button.click();
    await page.waitForTimeout(60);
    const chipCount = await page.locator('.matrix-lookup__chip .directive-chip').count();
    if (chipCount === 0) allPresetsResolved = false;
  }
  record('8 · both canonical-policy presets resolve to a directive chip', {
    ok: allPresetsResolved,
    detail: `${presetButtons.length} preset button(s) checked`,
  });

  // 8c: "All rows" shows MATRIX_ROWS.length cards, fired row first.
  await page.getByText('All rows', { exact: true }).click();
  await page.waitForTimeout(60);
  const cardCount = await page.locator('.matrix-row-card').count();
  const firstCardFired = await page.locator('.matrix-row-card').first().locator('.matrix-row-card__fired-tag').count();
  record(`8 · "All rows" shows all ${MATRIX_ROWS.length} rows as cards, fired row first`, {
    ok: cardCount === MATRIX_ROWS.length && firstCardFired > 0,
    detail: `cardCount=${cardCount} (expected ${MATRIX_ROWS.length}) firstCardFired=${firstCardFired > 0}`,
  });

  await context.close();
}

/* ---------- Self-test: prove the gate CAN fail ---------- */

async function runSelfTest(browser) {
  const iphone = devices['iPhone 13'];
  const context = await browser.newContext({ ...iphone });
  const page = await context.newPage();
  const viewport = iphone.viewport;

  // `?view=desktop` forces the workstation shell into sessionStorage; a
  // second navigation to `?view=advisor` keeps that forced shell (the
  // stored choice persists) while the ROUTE becomes "advisor" — the
  // desktop AdvisorView, on a phone viewport.
  await page.goto(`${BASE_URL}/?view=desktop`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(150);
  await page.goto(`${BASE_URL}/?view=advisor`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(150);

  const checks = [
    ['1 · no desktop chrome, no table', await evalNoDesktopChrome(page)],
    ['3 · first content in top 35%', await evalFirstContentTop(page, viewport.height, '.advisor-wizard__screen')],
    ['4 · every interactive target ≥44×44', await evalTouchTargets(page, TOUCH_TARGET_ALLOWLIST)],
  ];

  await context.close();

  console.log('\n--self-test: forcing the desktop shell onto an iPhone-13 viewport (?view=desktop then ?view=advisor) --');
  let allFailedAsExpected = true;
  for (const [id, result] of checks) {
    const expectedToFail = !result.ok;
    console.log(`${expectedToFail ? '✓ (correctly FAILS)' : '✗ (did NOT fail — gate cannot distinguish this from the real wizard)'} ${id} — ${result.detail}`);
    if (!expectedToFail) allFailedAsExpected = false;
  }
  console.log('');
  if (allFailedAsExpected) {
    console.log('self-test PASSED: the squeezed desktop layout fails checks 1, 3 and 4, as required.');
  } else {
    console.log('self-test FAILED: at least one check did not fail against the forced desktop layout.');
    process.exitCode = 1;
  }
}

async function main() {
  await runVite(['build', '--outDir', OUT_DIR]);
  const previewChild = startPreview();
  let previewExitError = null;
  previewChild.once('exit', (code) => {
    if (code !== null && code !== 0) previewExitError = new Error(`vite preview exited early with code ${code}`);
  });

  try {
    await waitForServer(BASE_URL);
    const browser = await chromium.launch();
    try {
      if (SELF_TEST) {
        await runSelfTest(browser);
      } else {
        await runAdvisorWizardChecks(browser);
        await runAdviceFirstPath(browser);
        await runTamperMode(browser, 'add-field');
        await runTamperMode(browser, 'bump-version');
        await runTamperMode(browser, 'forge-id');
        await runMatrixLookupChecks(browser);
      }
    } finally {
      await browser.close();
    }
    if (previewExitError) throw previewExitError;
  } finally {
    previewChild.kill();
  }

  if (!SELF_TEST) {
    console.log('');
    for (const { id, status, detail } of outcomes) {
      console.log(`${status === 'pass' ? '✓' : '✗'} ${id}${detail ? ` — ${detail}` : ''}`);
    }
    const failed = outcomes.filter((o) => o.status === 'fail');
    console.log('');
    console.log(`${outcomes.length - failed.length}/${outcomes.length} checks passed, ${failed.length} failed.`);
    if (failed.length > 0) process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
