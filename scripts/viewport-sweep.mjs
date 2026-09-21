#!/usr/bin/env node
/* Viewport sweep — every surface at every shape it will actually be seen in.
 *
 * Owner, 2026-09-21: "portrait and landscape on both mobile and tablet need to
 * be verified as well as full desktop views on both". Until this script
 * existed, exactly one shape had been looked at (a phone, portrait).
 *
 * The matrix (devices are Playwright's own descriptors, so user agent, touch,
 * device-scale-factor and the *visible* viewport are the real ones):
 *   phone portrait / phone landscape / tablet portrait / tablet landscape
 *   × { the layout the app chooses, the full desktop view forced with
 *       ?view=desktop }                       … plus two true desktop sizes.
 *
 * For every cell × screen it checks the floor (nothing wider than the
 * viewport, no sideways scroller, the document is the only vertical scroller,
 * the expected shell is the one mounted) and, on the companion, the phone
 * contract (tab bar fixed, targets ≥ 44, first content high enough, enough of
 * the screen left for content once the fixed chrome is subtracted). It writes
 * a first-screen PNG per cell so a human LOOKS at each shape — a passing
 * number is not a look.
 *
 *   node scripts/viewport-sweep.mjs            run the matrix
 *   node scripts/viewport-sweep.mjs --shots    also write media/viewport/*.png
 */
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, devices } from '@playwright/test';
import { LEDGER } from '../src/data/ledger.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const VITE_BIN = join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
const PORT = 4291;
const OUT_DIR = 'dist-viewport';
const BASE_URL = `http://127.0.0.1:${PORT}`;
const SHOTS = process.argv.includes('--shots');
const SHOT_DIR = join(ROOT, 'media', 'viewport');
const WORKSTATION_MIN = 1024;

const desktop = (width, height) => ({ viewport: { width, height }, deviceScaleFactor: 1, isMobile: false, hasTouch: false });

/* `forced` = the full desktop view requested on a small device. */
const CELLS = [
  { id: 'phone-portrait', device: devices['iPhone 13'], forced: false },
  { id: 'phone-landscape', device: devices['iPhone 13 landscape'], forced: false },
  { id: 'tablet-portrait', device: devices['iPad Mini'], forced: false },
  { id: 'tablet-landscape', device: devices['iPad Mini landscape'], forced: false },
  { id: 'tablet-large-portrait', device: devices['iPad Pro 11'], forced: false },
  { id: 'tablet-large-landscape', device: devices['iPad Pro 11 landscape'], forced: false },
  { id: 'phone-portrait-DESKTOP', device: devices['iPhone 13'], forced: true },
  { id: 'phone-landscape-DESKTOP', device: devices['iPhone 13 landscape'], forced: true },
  { id: 'tablet-portrait-DESKTOP', device: devices['iPad Mini'], forced: true },
  { id: 'tablet-large-portrait-DESKTOP', device: devices['iPad Pro 11'], forced: true },
  { id: 'desktop-1280', device: desktop(1280, 800), forced: false },
  { id: 'desktop-1440', device: desktop(1440, 900), forced: false },
];

const DECISION_ID = LEDGER.find((entry) => entry.fabric?.kind === 'ticket').scenario.id;
const SCREENS = [
  { id: 'home', query: '' },
  { id: 'landing', query: '', gated: true },
  { id: 'decisions', query: 'view=decisions' },
  { id: 'decision', query: `view=decisions&d=${encodeURIComponent(DECISION_ID)}` },
  { id: 'advisor', query: 'view=advisor' },
  { id: 'matrix', query: 'view=matrix' },
  { id: 'policies', query: 'view=policies' },
  { id: 'boundary', query: 'view=boundary' },
];

/* ISSUE-003 added a landing/onboarding gate in front of every route. Every
 * cell's context is seeded past it (below) so `home` and every other screen
 * see the app, exactly as before ISSUE-003 landed — EXCEPT `landing`, which
 * opens its own UNSEEDED context per cell specifically to look at the gate
 * itself at every shape. A forced-desktop cell reaches the workstation shell
 * via a deep link (`?view=desktop`, which `isDeepLink` always bypasses the
 * gate for) before `landing` would ever apply, so those cells skip it — see
 * the loop below, which never opens `landing` for a `forced` cell. */
function seedPastEntryGate(context) {
  return context.addInitScript(() => {
    try {
      window.sessionStorage.setItem('janus:entered', '1');
      window.localStorage.setItem('janus:onboarded', 'done');
    } catch {
      // Storage blocked — nothing to seed; the gate's own try/catch handles it.
    }
  });
}

function runVite(args) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(process.execPath, [VITE_BIN, ...args], { cwd: ROOT, stdio: ['ignore', 'ignore', 'inherit'] });
    child.once('error', rejectRun);
    child.once('exit', (code) => (code === 0 ? resolveRun() : rejectRun(new Error(`vite ${args.join(' ')} exited ${code}`))));
  });
}

async function waitForServer(url, timeoutMs = 20000) {
  const startedAt = Date.now();
  for (;;) {
    try { await fetch(url); return; } catch {
      if (Date.now() - startedAt > timeoutMs) throw new Error(`Timed out waiting for ${url}`);
      await new Promise((r) => setTimeout(r, 300));
    }
  }
}

/* Everything measured in ONE page.evaluate so the numbers describe one moment. */
function measure() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  // Visible = a person could reach it by scrolling vertically: it must
  // intersect the viewport horizontally. (The shared benchmark probe once
  // counted a closed off-canvas drawer as visible; same rule here. Elements
  // that start on screen and run past the right edge still count — that is
  // exactly what the too-wide check below is for.)
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 1 && r.height > 1 && r.right > 1 && r.left < vw - 1
      && s.visibility !== 'hidden' && s.display !== 'none';
  };
  const label = (el) => `${el.tagName.toLowerCase()}.${(typeof el.className === 'string' ? el.className : '').trim().split(/\s+/).slice(0, 2).join('.')}`;

  const tooWide = [];
  const sideScrollers = [];
  for (const el of document.querySelectorAll('body *')) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.right > vw + 1) tooWide.push(`${label(el)} right=${Math.round(r.right)}`);
    const s = getComputedStyle(el);
    if ((s.overflowX === 'auto' || s.overflowX === 'scroll') && el.scrollWidth > el.clientWidth + 1) sideScrollers.push(label(el));
  }

  const small = [];
  for (const el of document.querySelectorAll('button, a[href], select, input:not([type=hidden]), textarea, summary, [role="button"]')) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 44 || r.height < 44) small.push(`${label(el)} ${Math.round(r.width)}×${Math.round(r.height)}`);
  }

  // Chrome that permanently costs VERTICAL space: fixed or sticky bars that
  // span the screen's width. A side rail (the landscape tab bar) costs width,
  // not height, and an in-flow action bar scrolls away — neither counts. The
  // first version summed every listed element's height and reported 386px of
  // chrome on a 342px screen because it added the full-height rail.
  let chrome = 0;
  for (const sel of ['.companion-appbar', '.companion-tabs', '.wizard-actionbar', '.app-topbar']) {
    const el = document.querySelector(sel);
    if (!el || !visible(el)) continue;
    const position = getComputedStyle(el).position;
    const r = el.getBoundingClientRect();
    if ((position === 'fixed' || position === 'sticky') && r.width >= vw * 0.8) chrome += r.height;
  }
  const rail = document.querySelector('.companion-tabs');
  const railBox = rail && visible(rail) ? rail.getBoundingClientRect() : null;
  const sideRail = railBox && railBox.height > railBox.width ? Math.round(railBox.width) : 0;

  const firstContent = document.querySelector(
    '.landing h1, .attention-card__button, .decision-card__button, .story__verdict-row, .advisor-wizard__screen, .matrix-lookup__dock, .data-state, .data-table, .detail-page .identity-chain, .page-heading',
  );
  const tabs = document.querySelector('.companion-tabs');
  const tabBox = tabs ? tabs.getBoundingClientRect() : null;
  const backToPhone = document.querySelector('.app-topbar__back-to-phone');
  const backBox = backToPhone && visible(backToPhone) ? backToPhone.getBoundingClientRect() : null;

  return {
    vw, vh,
    docWidth: document.documentElement.scrollWidth,
    docHeight: document.documentElement.scrollHeight,
    bodyHeight: document.body.scrollHeight,
    shell: document.querySelector('.app-sidebar')
      ? 'desktop'
      : document.querySelector('.companion-tabs')
        ? 'companion'
        : document.querySelector('.landing')
          ? 'landing'
          : 'none',
    tooWide: tooWide.slice(0, 4),
    tooWideCount: tooWide.length,
    sideScrollers: [...new Set(sideScrollers)].slice(0, 4),
    small: small.slice(0, 5),
    smallCount: small.length,
    chrome: Math.round(chrome),
    sideRail,
    firstContentTop: firstContent ? Math.round(firstContent.getBoundingClientRect().top) : null,
    tabBarBottomGap: tabBox ? Math.round(vh - tabBox.bottom) : null,
    tabBarWidth: tabBox ? Math.round(tabBox.width) : null,
    tabBarHeight: tabBox ? Math.round(tabBox.height) : null,
    hasTable: Boolean(document.querySelector('table')),
    backToPhone: backBox ? { left: Math.round(backBox.left), right: Math.round(backBox.right), top: Math.round(backBox.top) } : null,
    sidebarWidth: document.querySelector('.app-sidebar') ? Math.round(document.querySelector('.app-sidebar').getBoundingClientRect().width) : null,
  };
}

function judge(cell, screen, m) {
  const problems = [];
  const expectDesktop = cell.forced || cell.device.viewport.width >= WORKSTATION_MIN;
  // `landing` (ISSUE-003) is neither shell — it is the gate in front of both,
  // opened on its own unseeded context — so it gets its own expectation
  // instead of the desktop/companion split every other screen judges against.
  const expectedShell = screen.gated ? 'landing' : expectDesktop ? 'desktop' : 'companion';
  if (m.shell !== expectedShell) problems.push(`shell=${m.shell}, expected ${expectedShell}`);
  if (m.docWidth > m.vw + 1) problems.push(`page scrolls sideways (${m.docWidth} > ${m.vw})`);
  if (m.tooWideCount) problems.push(`${m.tooWideCount} element(s) past the viewport: ${m.tooWide.join('; ')}`);
  if (m.sideScrollers.length) problems.push(`sideways scroller(s): ${m.sideScrollers.join(', ')}`);
  if (Math.abs(m.bodyHeight - m.docHeight) > 1) problems.push(`body is a scroller (${m.bodyHeight} vs ${m.docHeight})`);

  if (screen.gated) {
    if (m.smallCount) problems.push(`${m.smallCount} landing target(s) under 44×44: ${m.small.join('; ')}`);
    // The top-35% rule is the PHONE layout's contract (docs/DESIGN-SYSTEM.md
    // "Entry: landing and orientation") — the workstation layout centres its
    // copy in a two-column hero instead, so it never claims that number.
    if (!expectDesktop && m.firstContentTop !== null && m.firstContentTop > m.vh * 0.35) {
      problems.push(`landing H1 starts at ${m.firstContentTop}px (${Math.round((m.firstContentTop / m.vh) * 100)}% down a ${m.vh}px screen, expected <=35%)`);
    }
  }

  if (m.shell === 'companion') {
    if (m.hasTable) problems.push('a <table> is rendered on the companion');
    if (m.smallCount) problems.push(`${m.smallCount} target(s) under 44×44: ${m.small.join('; ')}`);
    if (m.tabBarBottomGap !== null && Math.abs(m.tabBarBottomGap) > 1 && m.tabBarWidth > m.tabBarHeight) problems.push(`bottom tab bar is ${m.tabBarBottomGap}px off the viewport bottom`);
    const contentRatio = (m.vh - m.chrome) / m.vh;
    if (contentRatio < 0.6) problems.push(`only ${Math.round(contentRatio * 100)}% of the screen's height is left for content (${m.chrome}px of fixed bars in ${m.vh}px)`);
    if (m.sideRail > m.vw * 0.15) problems.push(`the side rail takes ${m.sideRail}px of a ${m.vw}px-wide screen`);
    // A short landscape screen must not spend its height on a bottom bar.
    if (m.vh <= 500 && m.vw > m.vh && m.sideRail === 0) problems.push(`short landscape screen (${m.vw}×${m.vh}) still uses a bottom tab bar`);
    if (m.firstContentTop !== null && m.firstContentTop > m.vh * 0.45) problems.push(`first content starts at ${m.firstContentTop}px (${Math.round((m.firstContentTop / m.vh) * 100)}% down a ${m.vh}px screen)`);
  }

  if (cell.forced) {
    if (m.vw < WORKSTATION_MIN) problems.push(`the forced desktop is laid out at ${m.vw}px — it must be a real desktop width, scaled to the screen`);
    if (!m.backToPhone) problems.push('no visible "Back to the phone layout" link in the forced desktop view');
    else if (m.backToPhone.right > m.vw || m.backToPhone.left < 0) problems.push(`"Back to the phone layout" is off-screen (left=${m.backToPhone.left}, right=${m.backToPhone.right}, vw=${m.vw})`);
    if (m.sidebarWidth !== null && m.sidebarWidth > m.vw * 0.6) problems.push(`the desktop sidebar takes ${m.sidebarWidth}px of a ${m.vw}px screen — this is a stacked reflow, not the full desktop view`);
  }
  return problems;
}

async function main() {
  await runVite(['build', '--outDir', OUT_DIR, '--logLevel', 'error']);
  const preview = spawn(process.execPath, [VITE_BIN, 'preview', '--outDir', OUT_DIR, '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
  let failures = 0;
  let checks = 0;
  try {
    await waitForServer(BASE_URL);
    if (SHOTS) mkdirSync(SHOT_DIR, { recursive: true });
    const browser = await chromium.launch();
    try {
      for (const cell of CELLS) {
        const context = await browser.newContext({ ...cell.device });
        await seedPastEntryGate(context);
        const page = await context.newPage();
        if (cell.forced) {
          // Ask for the full desktop view exactly as a visitor does. `?view=`
          // is itself a deep link (src/utils/entryGate.js), so this also
          // bypasses the landing/onboarding gate regardless of seeding.
          await page.goto(`${BASE_URL}/?view=desktop`, { waitUntil: 'networkidle' });
        }
        const v = cell.device.viewport;
        console.log(`\n== ${cell.id}  (${v.width}×${v.height}${cell.forced ? ', full desktop view forced' : ''})`);
        for (const screen of SCREENS) {
          // A forced-desktop cell reaches the workstation shell through a
          // deep link, which always bypasses the gate — there is no way to
          // see the real landing there, and no forced mode for it to differ
          // by, so this cell simply skips the `landing` screen.
          if (screen.gated && cell.forced) continue;

          if (screen.gated) {
            // The gate itself, on a context NO seeding has touched.
            const freshContext = await browser.newContext({ ...cell.device });
            const freshPage = await freshContext.newPage();
            await freshPage.goto(BASE_URL, { waitUntil: 'networkidle' });
            await freshPage.evaluate(() => document.fonts.ready);
            await freshPage.waitForTimeout(150);
            const m = await freshPage.evaluate(measure);
            const problems = judge(cell, screen, m);
            checks += 1;
            if (problems.length) failures += 1;
            console.log(`${problems.length ? '✗' : '✓'} ${screen.id.padEnd(10)} shell=${m.shell.padEnd(9)} layout=${m.vw}×${m.vh} chrome=${m.chrome}px first=${m.firstContentTop ?? '—'}px${problems.length ? `\n    - ${problems.join('\n    - ')}` : ''}`);
            if (SHOTS) {
              await freshPage.screenshot({ path: join(SHOT_DIR, `${cell.id}--${screen.id}.png`), fullPage: false });
            }
            await freshContext.close();
            continue;
          }

          await page.goto(`${BASE_URL}/${screen.query ? `?${screen.query}` : ''}`, { waitUntil: 'networkidle' });
          await page.evaluate(() => document.fonts.ready);
          await page.waitForTimeout(150);
          const m = await page.evaluate(measure);
          const problems = judge(cell, screen, m);
          checks += 1;
          if (problems.length) failures += 1;
          console.log(`${problems.length ? '✗' : '✓'} ${screen.id.padEnd(10)} shell=${m.shell.padEnd(9)} layout=${m.vw}×${m.vh} chrome=${m.chrome}px first=${m.firstContentTop ?? '—'}px${problems.length ? `\n    - ${problems.join('\n    - ')}` : ''}`);
          if (SHOTS && ['home', 'decision', 'advisor'].includes(screen.id)) {
            await page.screenshot({ path: join(SHOT_DIR, `${cell.id}--${screen.id}.png`), fullPage: false });
          }
        }
        await context.close();
      }
    } finally {
      await browser.close();
    }
  } finally {
    preview.kill();
  }
  console.log(`\n${checks - failures}/${checks} cell×screen checks passed, ${failures} failed.`);
  process.exit(failures ? 1 : 0);
}

main().catch((error) => { console.error(error); process.exit(2); });
