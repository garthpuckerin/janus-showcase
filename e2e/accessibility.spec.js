/* Accessibility gate — axe-core over every rendered route, at desktop and
 * phone width, in both themes. This is the check the repo's contrast test
 * cannot be: that test pins token PAIRS in isolation, never what actually
 * lands in the DOM (real contrast against real backgrounds, landmark and
 * heading structure, name/role/value on real controls, focus order in real
 * overlays). Zero rule exclusions, zero disabled rules — a violation here is
 * a real defect, not a note to file and move on. Pattern ported from
 * dreamcatcher-showcase/e2e/accessibility.spec.js and adapted to Janus's
 * `?view=` router and its `janus:entered` / `janus:onboarded` landing
 * contract (see the ISSUE-003 handoff: the other agent's landing gate reads
 * these same two keys, harmless before that work lands).
 *
 * The three decision-detail cases are picked by PROPERTY from the real
 * ledger (a ticket, a Fabric rejection, a pre-matrix fail-closed) rather
 * than a hardcoded scenario id, the same way scripts/mobile-sweep.mjs picks
 * its story cases — so this stays honest if the fixture set is ever
 * reshuffled.
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { LEDGER } from '../src/data/ledger.js';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

function pickByProperty(predicate, label) {
  const entry = LEDGER.find(predicate);
  if (!entry) throw new Error(`accessibility.spec: no ledger entry found for "${label}"`);
  return entry;
}

const TICKET_CASE = pickByProperty((entry) => entry.fabric?.kind === 'ticket', 'a decision that issued a ticket');
const REJECTION_CASE = pickByProperty((entry) => entry.fabric?.kind === 'rejection', 'a decision Fabric rejected');
const PRE_MATRIX_CASE = pickByProperty(
  (entry) => entry.evaluation.diagnostics.matrix_row === null,
  'a decision that failed closed pre-matrix',
);

/* Every primary route, plus the three decision-detail cases above. Desk-only
 * routes (policies, boundary) render the real workstation view on the
 * desktop project and the shared `DeskOnlyState` on the phone project — both
 * are worth scanning, so they stay in one shared list. */
const ROUTES = [
  ['decisions', 'view=decisions'],
  ['decision-ticket', `view=decisions&d=${encodeURIComponent(TICKET_CASE.scenario.id)}`],
  ['decision-rejection', `view=decisions&d=${encodeURIComponent(REJECTION_CASE.scenario.id)}`],
  ['decision-pre-matrix', `view=decisions&d=${encodeURIComponent(PRE_MATRIX_CASE.scenario.id)}`],
  ['advisor', 'view=advisor'],
  ['matrix', 'view=matrix'],
  ['policies', 'view=policies'],
  ['boundary', 'view=boundary'],
];

const THEMES = [
  ['light', null],
  ['dark', 'theme=dark'],
];

function urlFor(query, themeParam) {
  const params = [query, themeParam].filter(Boolean);
  return params.length ? `/?${params.join('&')}` : '/';
}

/** Seed the two keys the landing-gate/onboarding work (ISSUE-003) reads —
 *  harmless today (nothing in this build checks them yet), required once
 *  that work lands so this gate keeps landing inside the app rather than on
 *  the new landing screen. */
async function seedEntered(page) {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('janus:entered', '1');
      localStorage.setItem('janus:onboarded', 'done');
    } catch {
      /* Storage blocked — nothing to seed. */
    }
  });
}

const formatViolations = (violations) =>
  violations
    .map((v) => {
      const nodes = v.nodes
        .slice(0, 5)
        .map((n) => `    ${n.target.join(' ')}\n      ${n.failureSummary || ''}`)
        .join('\n');
      return `[${v.impact}] ${v.id}: ${v.help}\n${nodes}`;
    })
    .join('\n\n');

const expectNoViolations = async (page, label) => {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  expect(violations, `${label}\n${formatViolations(violations)}`).toEqual([]);
};

for (const [themeName, themeParam] of THEMES) {
  test.describe(`axe · ${themeName}`, () => {
    for (const [routeName, query] of ROUTES) {
      test(`${routeName} has no WCAG A/AA violations`, async ({ page }) => {
        await seedEntered(page);
        await page.goto(urlFor(query, themeParam), { waitUntil: 'networkidle' });
        await page.evaluate(() => document.fonts?.ready);
        await expectNoViolations(page, `${themeName} · ${routeName}`);
      });
    }

    test('unseeded root has no WCAG A/AA violations', async ({ page }) => {
      // Deliberately NOT seeded: today this renders the app itself; once the
      // landing gate (ISSUE-003) lands it will render the landing screen
      // instead. Assert nothing about which one — only that whichever one
      // paints is accessible.
      await page.goto(urlFor('', themeParam), { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts?.ready);
      await expectNoViolations(page, `${themeName} · unseeded root`);
    });

    test('the orientation has no WCAG A/AA violations on any of its beats', async ({ page }) => {
      // Unseeded on purpose: the landing, then every beat of the first run —
      // a dialog on the workstation, one beat per screen on the phone.
      await page.goto(urlFor('', themeParam), { waitUntil: 'networkidle' });
      await page.getByRole('button', { name: 'Enter the console' }).click();
      for (let beat = 1; ; beat += 1) {
        await expect(page.getByText(new RegExp(`step ${beat} of \\d+`, 'i')).first()).toBeVisible();
        await expectNoViolations(page, `${themeName} · orientation beat ${beat}`);
        const next = page.getByRole('button', { name: 'Next', exact: true });
        if ((await next.count()) === 0) break;
        await next.click();
      }
      // The last beat's primary action lands in the app.
      await page.getByRole('button', { name: 'Open the console' }).click();
      await expect(page.locator('.app-sidebar, .companion-tabs').first()).toBeVisible();
    });

    // Phone-only overlays: the More sheet and the Advisor wizard's first
    // step only exist on the companion shell, so these run once, on the
    // `iPhone 13` project, and are skipped on desktop rather than duplicated
    // into a route list that would be meaningless there.
    test('phone: More sheet has no WCAG A/AA violations', async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'iPhone 13', 'the More sheet only exists on the companion shell');
      await seedEntered(page);
      await page.goto(urlFor('', themeParam), { waitUntil: 'networkidle' });
      await page.getByRole('button', { name: 'More', exact: true }).click();
      await expect(page.locator('.companion-sheet')).toBeVisible();
      await expectNoViolations(page, `${themeName} · phone · More sheet`);
    });

    test("phone: Advisor wizard's first step has no WCAG A/AA violations", async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'iPhone 13', 'the Advisor wizard only exists on the companion shell');
      await seedEntered(page);
      await page.goto(urlFor('view=advisor', themeParam), { waitUntil: 'networkidle' });
      await expect(page.locator('.advisor-wizard')).toBeVisible();
      await expectNoViolations(page, `${themeName} · phone · Advisor wizard (first step)`);
    });
  });
}
