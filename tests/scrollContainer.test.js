/* Scroll-container gate. The DOCUMENT is the only vertical scroller.
   Found in review: `html, body, #root { height: 100% }` plus an
   `overflow-x: hidden` guard made <body> the scroll container — the document
   reported 900px while its content was 1,876px. Full-page captures clipped at
   one screen, and it is the nested scroll the mobile sweep forbids. Hiding
   overflow on one axis computes the other to `auto`, so ANY overflow
   declaration on a page-level box is refused, not just `overflow-y`. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { walk, stripComments } from './_designSystemFs.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const STYLES_DIR = join(ROOT, 'src', 'styles');

/* Boxes that wrap the whole page. None may scroll or take a fixed height. */
const PAGE_LEVEL = ['html', 'body', '#root', '.app-shell', '.app-main', '.app-main__inner'];

const isPageLevel = (selectorPart) => PAGE_LEVEL.includes(selectorPart.trim());

function pageLevelRules() {
  const rules = [];
  for (const file of walk(STYLES_DIR, ['.css'])) {
    const css = stripComments(readFileSync(file, 'utf8'));
    for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const parts = match[1].split(',');
      if (parts.some(isPageLevel)) {
        rules.push({ file: file.replace(ROOT, ''), selector: match[1].trim().replace(/\s+/g, ' '), body: match[2] });
      }
    }
  }
  return rules;
}

test('the gate actually sees the page-level rules', () => {
  const selectors = pageLevelRules().map((r) => r.selector).join(' | ');
  for (const needle of ['body', '.app-shell', '.app-main']) {
    assert.ok(selectors.includes(needle), `expected a rule for ${needle}`);
  }
});

test('no page-level box declares overflow — the document is the only scroller', () => {
  const offenders = pageLevelRules()
    .filter((r) => /(^|;|\s)overflow(-x|-y)?\s*:/.test(r.body))
    .map((r) => `${r.file}: ${r.selector}`);
  assert.deepEqual(offenders, []);
});

test('no page-level box takes a fixed or percentage height', () => {
  const offenders = pageLevelRules()
    .filter((r) => /(^|;|\s)(max-)?height\s*:\s*(100%|100vh|100dvh|\d)/.test(r.body))
    .map((r) => `${r.file}: ${r.selector}`);
  assert.deepEqual(offenders, []);
});
