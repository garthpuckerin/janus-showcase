#!/usr/bin/env node
/* White-glove sweep — the gate the other sweeps don't cover: rendered TEXT
 * defects (leaked placeholders, doubled words/punctuation, a raw absolute
 * date where the demo promises anchor-relative time, broken heading
 * structure) and INERT AFFORDANCES (anything that LOOKS clickable but does
 * nothing). Modelled on `scripts/mobile-sweep.mjs` and
 * `scripts/viewport-sweep.mjs`: builds the app to its own outDir
 * (`dist-gates`), serves it on its own port (4293) with
 * `vite preview --strictPort`, and always kills the preview child in a
 * `finally`.
 *
 * Walks every primary route plus the three decision-detail cases (a ticket,
 * a Fabric rejection, a pre-matrix fail-closed — picked by PROPERTY from the
 * real ledger, the same way mobile-sweep picks its story cases) at 1440×900
 * and on a seeded iPhone 13, plus the phone-only More sheet, plus the
 * unseeded root at both widths.
 *
 * `--self-test` is the honesty check the build brief asks for: it injects a
 * dead `<button>` (wired to nothing) and a bare "undefined" text node into a
 * loaded page and asserts THIS sweep's own scan functions catch both — proof
 * the gate can fail, not just a floor every clean build already clears.
 *
 *   node scripts/whiteglove-sweep.mjs
 *   node scripts/whiteglove-sweep.mjs --self-test
 */
import { spawn } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, devices } from '@playwright/test';
import { LEDGER } from '../src/data/ledger.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const VITE_BIN = join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
const PORT = 4293;
const OUT_DIR = 'dist-gates';
const BASE_URL = `http://127.0.0.1:${PORT}`;
const SELF_TEST = process.argv.includes('--self-test');

const desktop = (width, height) => ({ viewport: { width, height }, deviceScaleFactor: 1, isMobile: false, hasTouch: false });

/* Picked by PROPERTY, never a hardcoded scenario id — see the file header. */
function pickByProperty(predicate, label) {
  const entry = LEDGER.find(predicate);
  if (!entry) throw new Error(`whiteglove-sweep: no ledger entry found for "${label}"`);
  return entry;
}
const TICKET_CASE = pickByProperty((e) => e.fabric?.kind === 'ticket', 'a decision that issued a ticket');
const REJECTION_CASE = pickByProperty((e) => e.fabric?.kind === 'rejection', 'a decision Fabric rejected');
const PRE_MATRIX_CASE = pickByProperty((e) => e.evaluation.diagnostics.matrix_row === null, 'a decision that failed closed pre-matrix');

const ROUTES = [
  { id: 'home', query: '' },
  { id: 'decisions', query: 'view=decisions' },
  { id: 'decision-ticket', query: `view=decisions&d=${encodeURIComponent(TICKET_CASE.scenario.id)}` },
  { id: 'decision-rejection', query: `view=decisions&d=${encodeURIComponent(REJECTION_CASE.scenario.id)}` },
  { id: 'decision-pre-matrix', query: `view=decisions&d=${encodeURIComponent(PRE_MATRIX_CASE.scenario.id)}` },
  { id: 'advisor', query: 'view=advisor' },
  { id: 'matrix', query: 'view=matrix' },
  { id: 'policies', query: 'view=policies' },
  { id: 'boundary', query: 'view=boundary' },
];

const VIEWPORTS = [
  { id: 'desktop', device: desktop(1440, 900), seeded: true },
  { id: 'phone', device: devices['iPhone 13'], seeded: true },
];

const AFFORDANCE_SELECTOR = 'button, a[href], [role="button"], summary, select';
const INTERACTIVE_ANCESTOR_SELECTOR = 'button, a[href], [role="button"], [tabindex], select, input, textarea, summary';

/* ---------- Text-defect patterns ---------- */
/* [label, regex] tested against the page's visible text. Ellipses ("...")
 * are stripped before the doubled-punctuation check runs, so a legitimate
 * ellipsis never trips it. */
const TEXT_DEFECTS = [
  ['the word "undefined"', /\bundefined\b/],
  ['the word "null"', /\bnull\b/],
  ['NaN', /\bNaN\b/],
  ['[object Object]', /\[object Object\]/],
  ['Invalid Date', /Invalid Date/],
  ['unrendered template braces', /\{\{|\}\}/],
  ['placeholder text "lorem"', /\blorem\b/i],
  ['a TODO/FIXME/TBD marker', /\b(TODO|FIXME|TBD)\b/],
  ['a literal leading "* " placeholder label', /(^|\n)\*\s+\S/],
  ['doubled punctuation', /([,.!?;:])\1/],
  ['a space before a comma or period', / [,.]/],
];

// Case-SENSITIVE and checked per leaf text node (see extractPageSignals) —
// a real typo repeats the exact same casing ("the the"); a data label
// immediately followed by an identifier that happens to start with the same
// word ("OUTCOME" followed by "outcome-77d8aa6d") is not a typo, and
// case-insensitive matching across two unrelated adjacent elements is what
// turned that into a false positive during this gate's own first run.
const DOUBLED_WORD = /\b(\w+)\s+\1\b/;

/* Absolute-time leaks — checked against text with mono/code/pre blocks
 * stripped out, since those legitimately show raw protocol payloads
 * (timestamps included). The demo's own claim is anchor-relative prose
 * ("3h ago" is right); an absolute date or a raw ISO stamp in PROSE breaks it. */
const DATE_LEAK_PATTERNS = [
  ['a raw ISO timestamp', /\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/],
  ['an absolute calendar date (YYYY-MM-DD)', /\b20\d\d-\d\d-\d\d\b/],
  ['an absolute calendar date (Month Day)', /\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\.?\s+\d{1,2}(st|nd|rd|th)?\b/],
];

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
    try { await fetch(url); return; } catch {
      if (Date.now() - startedAt > timeoutMs) throw new Error(`Timed out waiting for ${url}`);
      await new Promise((r) => setTimeout(r, 300));
    }
  }
}

async function seedPage(page) {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('janus:entered', '1');
      localStorage.setItem('janus:onboarded', 'done');
    } catch {
      /* Storage blocked — nothing to seed. */
    }
  });
}

/** Navigate to a fresh, known-clean state before every probe. Three
 *  different components ("Open the desktop layout" in `DeskOnlyState`,
 *  `MoreSheet`, and `StoryDeskLink`) force the workstation shell for the
 *  rest of the SESSION via `sessionStorage` (`janus:surface`) — one of
 *  scanAffordances' own probes on an earlier element can trigger this, and
 *  every later `gotoRoute()` on the same page would then land back on the
 *  desktop shell instead of the companion, breaking selectors like
 *  `getByRole('button', { name: 'More' })`. Clearing sessionStorage before
 *  every navigation (mirroring `scripts/mobile-sweep.mjs`'s check-7 pattern)
 *  keeps every probe isolated regardless of what an earlier one did. */
async function freshGoto(page, url) {
  await page.evaluate(() => {
    try { window.sessionStorage.clear(); } catch { /* not ready yet / blocked */ }
  }).catch(() => { /* no live document yet (first navigation) */ });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(150);
}

/* ---------- Findings ---------- */
const findings = [];
function note(where, what) {
  findings.push(`${where}: ${what}`);
}

/* ---------- Text-defect + structure scan ---------- */

/** Runs entirely in the page: visible text (mono blocks intact and mono
 *  blocks stripped, for the two different pattern sets), plus the heading
 *  list in document order for the structure checks. */
async function extractPageSignals(page) {
  return page.evaluate(() => {
    const visible = (el) => {
      const s = getComputedStyle(el);
      return s.display !== 'none' && s.visibility !== 'hidden';
    };
    const fullText = document.body.innerText;

    const nonMonoRoot = document.body.cloneNode(true);
    for (const el of nonMonoRoot.querySelectorAll('pre, code')) el.remove();
    const nonMonoText = nonMonoRoot.innerText ?? nonMonoRoot.textContent ?? '';

    const headings = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')]
      .filter(visible)
      .map((h) => ({ level: Number(h.tagName[1]), text: (h.textContent || '').trim() }));

    // "Doubled words" only means something WITHIN one piece of prose — two
    // unrelated elements that happen to sit next to each other with the same
    // short label (a nav tab named "More" right before a sheet titled
    // "More", or a "…Back to Attention" button right before an "Attention"
    // tab) are not a typo, and flattening the whole page into one string
    // cannot tell the two apart. A LEAF element (no element children, just
    // text) is one piece of authored prose; scanning each leaf's own text
    // independently is the structural fix, not an ever-growing exclusion
    // list of specific labels.
    const leafTexts = [...document.querySelectorAll('body *')]
      .filter((el) => visible(el) && el.children.length === 0 && (el.textContent || '').trim() !== '')
      .map((el) => el.textContent.trim());

    return { fullText, nonMonoText, headings, leafTexts };
  });
}

function scanTextDefects(where, text) {
  // Ellipses are legitimate; strip runs of 3+ dots before the doubled-
  // punctuation regex ever sees the text, so "…" / "..." never trips it.
  const withoutEllipses = text.replace(/\.{3,}/g, '');
  for (const [label, regex] of TEXT_DEFECTS) {
    const source = label === 'doubled punctuation' ? withoutEllipses : text;
    const match = source.match(regex);
    if (match) {
      const at = source.indexOf(match[0]);
      const context = source.slice(Math.max(0, at - 30), at + 30).replace(/\n/g, ' ⏎ ');
      note(where, `${label} → "…${context}…"`);
    }
  }
}

function scanDoubledWords(where, leafTexts) {
  for (const leaf of leafTexts) {
    const match = leaf.match(DOUBLED_WORD);
    if (match) {
      note(where, `doubled words → "${leaf.slice(0, 60)}"`);
    }
  }
}

function scanDateLeaks(where, nonMonoText) {
  for (const [label, regex] of DATE_LEAK_PATTERNS) {
    const match = nonMonoText.match(regex);
    if (match) {
      const at = nonMonoText.indexOf(match[0]);
      const context = nonMonoText.slice(Math.max(0, at - 30), at + 30).replace(/\n/g, ' ⏎ ');
      note(where, `${label} → "…${context}…"`);
    }
  }
}

function scanHeadingStructure(where, headings) {
  for (const h of headings) {
    if (h.text === '') note(where, `empty <h${h.level}>`);
  }
  let prevLevel = null;
  for (const h of headings) {
    if (prevLevel !== null && h.level > prevLevel + 1) {
      note(where, `heading level skip: h${prevLevel} → h${h.level} ("${h.text.slice(0, 40)}")`);
    }
    prevLevel = h.level;
  }
}

/* ---------- Inert-affordance scan ---------- */

/** Elements that LOOK interactive (computed cursor: pointer) but are
 *  neither themselves a real interactive element nor inside/around one. */
async function scanCursorPointerOffenders(page, where) {
  const offenders = await page.evaluate((interactiveSelector) => {
    const found = [];
    for (const el of document.querySelectorAll('body *')) {
      const rect = el.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) continue;
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') continue;
      if (style.cursor !== 'pointer') continue;
      if (el.matches(interactiveSelector)) continue;
      if (el.closest(interactiveSelector)) continue;
      if (el.querySelector(interactiveSelector)) continue;
      const cls = typeof el.className === 'string' ? el.className : '';
      found.push(`${el.tagName.toLowerCase()}.${cls.trim().split(/\s+/).slice(0, 2).join('.')}`);
    }
    return [...new Set(found)];
  }, INTERACTIVE_ANCESTOR_SELECTOR);
  for (const label of offenders) note(where, `looks clickable (cursor:pointer) but is not interactive and has no interactive ancestor/descendant: ${label}`);
}

/** One element's identifying info, read fresh after every reload so an index
 *  keeps meaning across navigations (DOM order from a static build is
 *  deterministic run to run). */
async function describeAffordanceElements(page) {
  return page.evaluate((selector) => {
    const visible = (el) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 1 && r.height > 1 && s.display !== 'none' && s.visibility !== 'hidden';
    };
    return [...document.querySelectorAll(selector)].map((el, index) => {
      const cls = typeof el.className === 'string' ? el.className : '';
      return {
        index,
        tag: el.tagName.toLowerCase(),
        label: `${el.tagName.toLowerCase()}.${cls.trim().split(/\s+/).slice(0, 2).join('.')} "${(el.textContent || '').trim().slice(0, 40)}"`,
        visible: visible(el),
        disabled: el.disabled === true || el.getAttribute('aria-disabled') === 'true',
        href: el.tagName === 'A' ? el.getAttribute('href') : null,
        hasDownload: el.hasAttribute('download'),
        optionCount: el.tagName === 'SELECT' ? el.options.length : null,
        currentValue: 'value' in el ? el.value : null,
        // A toggle/tab/nav-link that already represents the CURRENT
        // selection is expected to do nothing when clicked again — that is
        // correct idempotent behaviour, not evidence of being unwired. The
        // other option(s) in the same group are not already-active, so they
        // still get probed normally and would catch a genuinely dead toggle.
        alreadyActive: el.getAttribute('aria-pressed') === 'true'
          || el.getAttribute('aria-current') === 'page'
          || el.getAttribute('aria-selected') === 'true',
      };
    });
  }, AFFORDANCE_SELECTOR);
}

/** Click (or, for a <select>, change) one element by index and report
 *  whether ANYTHING observable happened: a URL change, a DOM mutation
 *  anywhere in the body, an aria-expanded/pressed/selected flip, a <details>
 *  open/close, a form value change, or focus moving into a dialog. */
async function probeOneAffordance(page, index, element) {
  // A REAL reload is detected by the page's own `load` event. The first
  // version inferred one from a missing window global (or any evaluate
  // error), and reported "Open the desktop layout" as a full page reload on
  // the emulated phone. It is not: a marker set on `window` survives the
  // click and no `load` fires (checked 2026-09-21) — the viewport-meta switch
  // just makes the first evaluate after it unreliable.
  let reloaded = false;
  const onLoad = () => { reloaded = true; };
  page.on('load', onLoad);
  await page.evaluate((idx) => {
    const el = document.querySelectorAll('button, a[href], [role="button"], summary, select')[idx];
    window.__wgObserved = false;
    window.__wgObserver = new MutationObserver(() => { window.__wgObserved = true; });
    window.__wgObserver.observe(document.body, { attributes: true, childList: true, subtree: true, characterData: true });
    window.__wgBefore = {
      url: location.href,
      ariaExpanded: el.getAttribute('aria-expanded'),
      ariaPressed: el.getAttribute('aria-pressed'),
      ariaSelected: el.getAttribute('aria-selected'),
      value: 'value' in el ? el.value : null,
      detailsOpen: el.closest('details') ? el.closest('details').hasAttribute('open') : null,
    };
  }, index);

  if (element.tag === 'select') {
    if (element.optionCount > 1) {
      await page.evaluate((idx) => {
        const el = document.querySelectorAll('button, a[href], [role="button"], summary, select')[idx];
        const next = [...el.options].findIndex((o) => o.value !== el.value);
        if (next >= 0) {
          el.selectedIndex = next;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, index);
    }
  } else {
    await page.evaluate((idx) => {
      document.querySelectorAll('button, a[href], [role="button"], summary, select')[idx].click();
    }, index);
  }
  await page.waitForTimeout(150);
  page.off('load', onLoad);
  if (reloaded) return { urlChanged: true, observed: true, focusInDialog: false, navigated: true, valueChanged: false };

  // A control that triggers a REAL full-page navigation (e.g. an
  // unprevented native form submit) lands us in a freshly-loaded document
  // where `window.__wgBefore` was never set — reading it throws, or
  // Playwright itself throws "Execution context was destroyed" if the
  // navigation was still in flight. Either way, that is unambiguously
  // "something happened" (more than expected, not less) — never inert — but
  // still worth surfacing distinctly, since an SPA control that causes a
  // real reload has thrown away in-memory state and is very likely its own
  // defect, not a false alarm from this probe.
  return page
    .evaluate((idx) => {
      const before = window.__wgBefore;
      if (!before) return { urlChanged: true, observed: true, focusInDialog: false, navigated: false, valueChanged: false };
      const observed = window.__wgObserved;
      window.__wgObserver?.disconnect();
      const urlChanged = location.href !== before.url;
      const focusInDialog = Boolean(document.activeElement?.closest('[role="dialog"]'));
      // React sets a controlled <select>/<input>'s `.value` as a DOM
      // PROPERTY, never the `value` ATTRIBUTE — a MutationObserver watching
      // `attributes: true` never sees it change. Re-read the live property
      // directly (best-effort: the element may have been replaced by a
      // re-render, in which case that replacement is already an observed
      // mutation).
      const stillThere = document.querySelectorAll('button, a[href], [role="button"], summary, select')[idx];
      const afterValue = stillThere && 'value' in stillThere ? stillThere.value : null;
      const valueChanged = before.value !== null && afterValue !== before.value;
      return { urlChanged, observed, focusInDialog, navigated: false, valueChanged };
    }, index)
    // No `load` fired, so whatever broke this read was a change in the page,
    // not a reload: something happened, and it was not a navigation.
    .catch(() => ({ urlChanged: true, observed: true, focusInDialog: false, navigated: false, valueChanged: false }));
}

/** Every visible button / a[href] / [role=button] / summary / select on the
 *  page must do SOMETHING when activated. Restores by reloading the route
 *  between every single probe, per the build brief. */
async function scanAffordances(page, where, gotoRoute) {
  const first = await describeAffordanceElements(page);
  const total = first.length;

  for (let index = 0; index < total; index += 1) {
    try {
      if (index > 0) {
        await gotoRoute();
      }
      const elements = await describeAffordanceElements(page);
      const el = elements[index];
      if (!el || !el.visible || el.disabled) continue;

      if (el.tag === 'a' && (el.href === '#' || el.href === '' || el.href === null)) {
        note(where, `inert affordance (empty/"#" href): ${el.label}`);
        continue;
      }
      if (el.hasDownload) continue; // a real download link — exempt from click-probing.
      if (el.tag === 'select' && el.optionCount !== null && el.optionCount <= 1) continue; // nothing to change to.
      if (el.alreadyActive) continue; // already the current selection — a no-op here is correct, not inert.

      const result = await probeOneAffordance(page, index, el);
      if (result.navigated) {
        note(where, `activating this control triggered a full page navigation/reload, not an in-app state change (in-memory SPA state would be lost): ${el.label}`);
        continue;
      }
      const somethingHappened = result.urlChanged || result.observed || result.focusInDialog || result.valueChanged;
      if (!somethingHappened) {
        note(where, `inert affordance (no observable change on activation): ${el.label}`);
      }
    } catch (error) {
      // One element misbehaving (e.g. an unexpected navigation mid-probe)
      // must not take down the whole sweep — report it as a finding and
      // keep walking the rest of this page's elements.
      note(where, `could not probe element index ${index} (${error.message}) — treat as a lead, not a pass`);
      try {
        await gotoRoute();
      } catch {
        /* best-effort recovery; the next route's own gotoRoute() will resync */
      }
    }
  }
}

/* ---------- One page, all scans ---------- */

async function scanPage(page, where, { affordances, gotoRoute } = {}) {
  const { fullText, nonMonoText, headings, leafTexts } = await extractPageSignals(page);
  scanTextDefects(where, fullText);
  scanDoubledWords(where, leafTexts);
  scanDateLeaks(where, nonMonoText);
  scanHeadingStructure(where, headings);
  if (affordances) await scanAffordances(page, where, gotoRoute);
  else await scanCursorPointerOffenders(page, where);
}

/* ---------- Normal sweep ---------- */

async function runNormalSweep(browser) {
  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({ ...vp.device });
    const page = await context.newPage();
    if (vp.seeded) await seedPage(page);

    for (const route of ROUTES) {
      const url = `${BASE_URL}/${route.query ? `?${route.query}` : ''}`;
      const gotoRoute = () => freshGoto(page, url);
      await gotoRoute();
      await scanPage(page, `${vp.id}:${route.id}`, { affordances: true, gotoRoute });
    }

    if (vp.id === 'phone') {
      const gotoRoute = async () => {
        await freshGoto(page, `${BASE_URL}/`);
        await page.getByRole('button', { name: 'More', exact: true }).click();
        await page.waitForSelector('.companion-sheet');
      };
      await gotoRoute();
      await scanPage(page, `${vp.id}:more-sheet`, { affordances: true, gotoRoute });
    }

    await context.close();
  }

  // Unseeded root, both widths — deliberately not seeded: today it shows the
  // app itself; once the landing gate (ISSUE-003) lands it will show the
  // landing screen. Neither text nor affordance checks assume which.
  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({ ...vp.device });
    const page = await context.newPage();
    const gotoRoute = () => freshGoto(page, `${BASE_URL}/`);
    await gotoRoute();
    await scanPage(page, `${vp.id}:unseeded-root`, { affordances: true, gotoRoute });
    await context.close();
  }
}

/* ---------- Self-test: prove the gate can fail ---------- */

async function runSelfTest(browser) {
  const context = await browser.newContext({ ...desktop(1440, 900) });
  const page = await context.newPage();
  await seedPage(page);
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(150);

  await page.evaluate(() => {
    const dead = document.createElement('button');
    dead.type = 'button';
    dead.id = 'wg-self-test-dead-button';
    dead.textContent = 'Self-test dead button';
    document.body.appendChild(dead);

    const textNode = document.createElement('div');
    textNode.id = 'wg-self-test-text';
    textNode.textContent = 'undefined';
    document.body.appendChild(textNode);
  });

  const before = findings.length;
  const gotoRoute = () => page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' }).then(async () => {
    await page.waitForTimeout(150);
    await page.evaluate(() => {
      if (!document.querySelector('#wg-self-test-dead-button')) {
        const dead = document.createElement('button');
        dead.type = 'button';
        dead.id = 'wg-self-test-dead-button';
        dead.textContent = 'Self-test dead button';
        document.body.appendChild(dead);
      }
      if (!document.querySelector('#wg-self-test-text')) {
        const textNode = document.createElement('div');
        textNode.id = 'wg-self-test-text';
        textNode.textContent = 'undefined';
        document.body.appendChild(textNode);
      }
    });
  });
  await scanPage(page, 'self-test', { affordances: true, gotoRoute });
  const selfTestFindings = findings.slice(before);

  await context.close();

  const caughtText = selfTestFindings.some((f) => f.includes('the word "undefined"'));
  const caughtButton = selfTestFindings.some((f) => f.includes('wg-self-test-dead-button') || f.includes('inert affordance'));

  console.log('\n--self-test: injecting a dead button and a bare "undefined" text node --');
  for (const f of selfTestFindings) console.log(`  ${f}`);
  console.log('');
  console.log(`${caughtText ? '✓' : '✗'} caught the injected text defect ("undefined")`);
  console.log(`${caughtButton ? '✓' : '✗'} caught the injected dead button`);

  if (caughtText && caughtButton) {
    console.log('\nself-test PASSED: the sweep correctly reports both injected defects.');
  } else {
    console.log('\nself-test FAILED: the sweep missed at least one injected defect — it cannot be trusted to catch a real one.');
    process.exitCode = 1;
  }
}

/* ---------- Main ---------- */

async function main() {
  await runVite(['build', '--outDir', OUT_DIR, '--logLevel', 'error']);
  const previewChild = startPreview();
  let previewExitError = null;
  previewChild.once('exit', (code) => {
    if (code !== null && code !== 0) previewExitError = new Error(`vite preview exited early with code ${code}`);
  });

  try {
    await waitForServer(BASE_URL);
    const browser = await chromium.launch();
    try {
      if (SELF_TEST) await runSelfTest(browser);
      else await runNormalSweep(browser);
    } finally {
      await browser.close();
    }
    if (previewExitError) throw previewExitError;
  } finally {
    previewChild.kill();
  }

  if (!SELF_TEST) {
    console.log('');
    if (findings.length === 0) {
      console.log('✓ white-glove sweep clean');
    } else {
      console.log(`${findings.length} issue(s):`);
      for (const f of findings) console.log(`  ✗ ${f}`);
      process.exitCode = 1;
    }
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
