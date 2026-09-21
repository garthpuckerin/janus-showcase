#!/usr/bin/env node
/* Mobile sweep — the gate that replaces "nothing is wider than the
 * viewport" as the mobile claim (docs/DESIGN-SYSTEM.md, "The phone
 * companion"). Builds the app, serves the LOCAL build candidate on
 * `vite preview --strictPort`, and runs the contract's numbered checks
 * against Playwright's emulated iPhone 13. The child preview server is
 * always killed in a `finally`, whether the sweep passes, fails, or throws.
 *
 * Points 1–5 and 7 of the contract's eight-point gate are implemented
 * against what the app has today; 6 and 8 (the decision-story stepper and
 * the onboarding tour) are not built yet and print as explicit PENDING
 * lines rather than silently passing or failing.
 *
 * `--self-test` is the honesty check the build brief asks for: it points
 * the SAME check functions at the desktop shell forced onto a phone
 * (`?view=desktop`) and asserts checks 1, 2 and 4 all FAIL there — proof
 * this gate can fail, not just a floor every collapsed desktop layout
 * would clear.
 */
import { spawn } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, devices } from '@playwright/test';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const VITE_BIN = join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
const PORT = 4288;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const SELF_TEST = process.argv.includes('--self-test');

// Explicit, reviewed allowlist for check 4 (inline text links only). Empty:
// every companion control built for this task clears 44×44 on its own.
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
  // `--host 127.0.0.1` pins the bind address to match BASE_URL exactly —
  // without it, `localhost` can resolve to `::1` first on some machines and
  // a 127.0.0.1 fetch never sees the server come up.
  return spawn(process.execPath, [VITE_BIN, 'preview', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
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

/* ---------- Low-level, reusable page checks. Each returns {ok, detail}. --- */

async function evalNoDesktopChrome(page) {
  const sidebarCount = await page.locator('.app-sidebar').count();
  const topbarCount = await page.locator('.app-topbar').count();
  const ok = sidebarCount === 0 && topbarCount === 0;
  return { ok, detail: ok ? 'no .app-sidebar / .app-topbar' : `.app-sidebar=${sidebarCount} .app-topbar=${topbarCount}` };
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
  return {
    ok,
    detail: ok
      ? `fixed to viewport bottom, ${tabs.length} tabs ≥44×44`
      : `bottomEdge=${Math.round(box.y + box.height)}/${viewportHeight} undersized=[${undersized.join(', ')}]`,
  };
}

async function evalFirstContentAndCards(page, viewportHeight, cardSelector) {
  const cards = await page.locator(cardSelector).all();
  if (cards.length === 0) return { ok: false, detail: `no elements matched ${cardSelector}` };

  const firstBox = await cards[0].boundingBox();
  const firstOk = Boolean(firstBox) && firstBox.y <= viewportHeight * 0.35;

  let visibleCount = 0;
  for (const card of cards) {
    const b = await card.boundingBox();
    if (b && b.y < viewportHeight && b.y + b.height > 0) visibleCount += 1;
  }
  const ok = firstOk && visibleCount >= 2;
  return {
    ok,
    detail: ok
      ? `first card top=${Math.round(firstBox.y)}px (≤35% of ${viewportHeight}), ${visibleCount} cards in first screen`
      : `firstCardTop=${firstBox ? Math.round(firstBox.y) : 'n/a'} (35% of ${viewportHeight}=${Math.round(viewportHeight * 0.35)}), visibleCards=${visibleCount}`,
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
      found.push(`body.scrollHeight (${document.body.scrollHeight}) != documentElement.scrollHeight (${document.documentElement.scrollHeight}) — the document may not be the only scroller`);
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

    // A dialog's own vertical scroller (the More sheet) is the one
    // sanctioned nested scroll region — an overlay, not a page-level box.
    for (const el of document.querySelectorAll('*')) {
      if (el === document.documentElement || el === document.body) continue;
      if (el.closest('[role="dialog"]')) continue;
      const style = getComputedStyle(el);
      if (/(auto|scroll)/.test(style.overflowY) && el.scrollHeight > el.clientHeight + 1) {
        found.push(`nested vertical scroller: ${el.tagName.toLowerCase()}.${(typeof el.className === 'string' ? el.className : '').slice(0, 30)}`);
      }
    }

    return found;
  }, viewportWidth);

  return { ok: problems.length === 0, detail: problems.length ? problems.slice(0, 6).join('; ') : 'no table, no overflow, document is the only scroller' };
}

/* ---------- Normal sweep ---------- */

const outcomes = [];
function record(id, { ok, detail }) {
  outcomes.push({ id, status: ok ? 'pass' : 'fail', detail });
}
function pendingLine(id, detail) {
  outcomes.push({ id, status: 'pending', detail });
}

async function checksOnScreen(page, label, { viewport, cardSelector, includeCardCheck }) {
  record(`1 · ${label}: desktop chrome absent`, await evalNoDesktopChrome(page));
  record(`2 · ${label}: bottom tab bar fixed + ≥44×44 tabs`, await evalBottomTabBar(page, viewport.height));
  if (includeCardCheck) {
    record(`3 · ${label}: first card in top 35%, ≥2 cards in first screen`, await evalFirstContentAndCards(page, viewport.height, cardSelector));
  }
  record(`4 · ${label}: every interactive target ≥44×44`, await evalTouchTargets(page, TOUCH_TARGET_ALLOWLIST));
  record(`5 · ${label}: no table, no overflow, one scroller`, await evalLayoutHygiene(page, viewport.width));
}

async function runNormalSweep(browser) {
  const iphone = devices['iPhone 13'];
  const context = await browser.newContext({ ...iphone });
  const page = await context.newPage();
  const viewport = iphone.viewport;

  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(200); // usePageReady's skeleton window

  await checksOnScreen(page, 'Attention', { viewport, cardSelector: '.attention-card__button', includeCardCheck: true });

  await page.goto(`${BASE_URL}/?view=decisions`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(200);
  await checksOnScreen(page, 'Decisions', { viewport, cardSelector: '.decision-card__button', includeCardCheck: true });

  await page.goto(`${BASE_URL}/?view=advisor`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(200);
  await checksOnScreen(page, 'Advisor tab', { viewport, includeCardCheck: false });

  // The open More sheet, from Attention.
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(200);
  // Exact + scoped: a loose name match once hit a card titled "…one more field…".
  await page.locator('.companion-tabs').getByRole('button', { name: 'More', exact: true }).click();
  await page.waitForSelector('.companion-sheet');
  await checksOnScreen(page, 'More sheet (open)', { viewport, includeCardCheck: false });
  await page.keyboard.press('Escape');

  pendingLine('6 · PENDING: collapsed decision story ≤3.5 viewports', 'the phone decision-story stepper is not built yet (this task ships an honest placeholder)');

  // Check 7: desk-only routes, and the escape hatch back to the desktop
  // shell. Each route gets a clean session — otherwise the first route's
  // "Open the desktop layout" click would leave its forced choice stored
  // and the second route would never see the companion at all.
  for (const routeName of ['policies', 'boundary']) {
    await page.evaluate(() => {
      try {
        window.sessionStorage.clear();
      } catch {
        // Storage blocked — nothing to clear.
      }
    });
    await page.goto(`${BASE_URL}/?view=${routeName}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(200);

    const deskOnlyVisible = await page.getByText(/stays at the workstation/i).count();
    record(`7 · ?view=${routeName} renders the desk-only state`, {
      ok: deskOnlyVisible > 0,
      detail: deskOnlyVisible > 0 ? 'desk-only copy found' : 'desk-only copy not found',
    });
    if (deskOnlyVisible === 0) continue;

    await page.getByRole('button', { name: 'Open the desktop layout' }).click();
    await page.waitForTimeout(150);
    const sidebarAfter = await page.locator('.app-sidebar').count();
    record(`7 · ?view=${routeName}, "Open the desktop layout" reaches the desktop shell`, {
      ok: sidebarAfter > 0,
      detail: sidebarAfter > 0 ? '.app-sidebar present after the click' : '.app-sidebar still absent',
    });
  }

  pendingLine('8 · PENDING: onboarding first spotlight', 'no onboarding/tour overlay exists yet in this build');

  await context.close();
}

/* ---------- Self-test: prove the gate CAN fail ---------- */

async function runSelfTest(browser) {
  const iphone = devices['iPhone 13'];
  const context = await browser.newContext({ ...iphone });
  const page = await context.newPage();
  const viewport = iphone.viewport;

  await page.goto(`${BASE_URL}/?view=desktop`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(200);

  const checks = [
    ['1 · desktop chrome absent', await evalNoDesktopChrome(page)],
    ['2 · bottom tab bar fixed + ≥44×44 tabs', await evalBottomTabBar(page, viewport.height)],
    ['3 · first card in top 35%, ≥2 cards in first screen', await evalFirstContentAndCards(page, viewport.height, '.attention-card__button')],
    ['4 · every interactive target ≥44×44', await evalTouchTargets(page, TOUCH_TARGET_ALLOWLIST)],
  ];

  await context.close();

  console.log('\n--self-test: forcing the desktop shell onto an iPhone-13 viewport (?view=desktop) --');
  let allFailedAsExpected = true;
  for (const [id, result] of checks) {
    const expectedToFail = !result.ok;
    console.log(`${expectedToFail ? '✓ (correctly FAILS)' : '✗ (did NOT fail — gate cannot distinguish this from the real companion)'} ${id} — ${result.detail}`);
    if (!expectedToFail) allFailedAsExpected = false;
  }
  console.log('');
  if (allFailedAsExpected) {
    console.log('self-test PASSED: the squeezed desktop layout fails checks 1, 2, 3 and 4, as required.');
  } else {
    console.log('self-test FAILED: at least one check did not fail against the forced desktop layout — the gate is not proven capable of failing.');
    process.exitCode = 1;
  }
}

async function main() {
  await runVite(['build']);
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
        await runNormalSweep(browser);
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
      const mark = status === 'pass' ? '✓' : status === 'pending' ? '…' : '✗';
      console.log(`${mark} ${id}${detail ? ` — ${detail}` : ''}`);
    }
    const failed = outcomes.filter((o) => o.status === 'fail');
    const pending = outcomes.filter((o) => o.status === 'pending');
    console.log('');
    console.log(`${outcomes.length - failed.length - pending.length}/${outcomes.length - pending.length} checks passed, ${pending.length} pending, ${failed.length} failed.`);
    if (failed.length > 0) process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
