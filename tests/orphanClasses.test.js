/* Orphan-class gate. Every class a component puts on an element must have at
   least one rule in some stylesheet, or be a declared style-less hook.

   Found in review: the directive chip — the product's core vocabulary —
   rendered as bare text on EVERY screen. Its rules lived in a screen
   stylesheet; a parallel rewrite of that screen deleted them. Nothing failed:
   unit tests do not look at CSS and an overflow sweep cannot see a missing
   style. This test reads the class names out of the JSX and looks for them. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { walk, stripComments } from './_designSystemFs.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/* Classes that exist only as hooks (for tests, scripts or a parent selector)
   and deliberately carry no rule of their own. Each needs a reason. */
const STYLELESS_HOOKS = new Map([
  ['directive-chip', 'hook for context sizing (matrix.css) and for the sweeps; styled by .chip'],
  ['advisor-view', 'view root; rhythm comes from the shell rule for view sections'],
  ['advisor-field', 'sits beside .field, which carries the styling'],
  ['boundary-runtime', 'sits beside .card; children are styled by their own classes'],
  ['policy-draft', 'sits beside .card; children are styled by their own classes'],
  ['rerun-panel', 'sits beside .card; layout lives on .rerun-panel__body / __fields'],
  ['identity-chain__mark', 'base of --match / --mismatch / --pending, which carry the colour'],
  ['app-topbar__back-to-phone', 'sits beside .button .button--ghost; hook for the mobile sweep'],
]);

function definedClasses() {
  const defined = new Set();
  for (const file of walk(join(ROOT, 'src', 'styles'), ['.css'])) {
    const css = stripComments(readFileSync(file, 'utf8'));
    for (const m of css.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) defined.add(m[1]);
  }
  return defined;
}

/* Static class tokens only: string literals and the literal parts of template
   strings inside className=..., plus `className: '...'` in lookup objects.
   Dynamic parts (${...}) are skipped, not guessed. */
function usedClasses() {
  const used = new Map();
  const add = (token, file) => {
    if (!/^-?[_a-zA-Z][\w-]*$/.test(token)) return;
    if (!used.has(token)) used.set(token, file.replace(ROOT, ''));
  };
  for (const file of walk(join(ROOT, 'src'), ['.jsx', '.js'])) {
    const src = readFileSync(file, 'utf8');
    const literals = [
      ...src.matchAll(/className=\s*"([^"]*)"/g),
      ...src.matchAll(/className=\s*\{\s*'([^']*)'\s*\}/g),
      ...src.matchAll(/className:\s*'([^']*)'/g),
    ].map((m) => m[1]);
    const templates = [...src.matchAll(/className=\s*\{\s*`([^`]*)`\s*\}/g)]
      .map((m) => m[1].replace(/\$\{[^}]*\}/g, ' '));
    for (const chunk of [...literals, ...templates]) {
      // a token glued to a ${...} is a prefix (e.g. "chip--"), not a class
      for (const token of chunk.split(/\s+/).filter(Boolean)) {
        if (token.endsWith('-')) continue;
        add(token, file);
      }
    }
  }
  return used;
}

test('the scanner sees the app (guards against a silently empty scan)', () => {
  const used = usedClasses();
  assert.ok(used.size > 60, `only ${used.size} class names found`);
  for (const expected of ['chip', 'card', 'data-state', 'panel-face', 'seam']) {
    assert.ok(used.has(expected), `expected to find "${expected}" in the JSX`);
  }
});

test('every class used in a component has a rule, or is a declared hook', () => {
  const defined = definedClasses();
  const orphans = [...usedClasses()]
    .filter(([token]) => !defined.has(token) && !STYLELESS_HOOKS.has(token))
    .map(([token, file]) => `${token}  (${file})`)
    .sort();
  assert.deepEqual(orphans, [], 'classes with no CSS rule anywhere');
});

test('every declared hook is still in use', () => {
  const used = usedClasses();
  const stale = [...STYLELESS_HOOKS.keys()].filter((hook) => !used.has(hook));
  assert.deepEqual(stale, []);
});
