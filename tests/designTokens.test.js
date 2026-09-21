/* Design-system gate (docs/DESIGN-SYSTEM.md): tokens.css is the only file
 * allowed to hold a colour literal, gradients/backdrop-filter are forbidden
 * everywhere, and the three off-brand hues must never appear. Also checks
 * that tokens.css actually defines the contract's tokens and that the dark
 * theme redefines everything the light/dark tables say differs. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { walk, stripComments } from './_designSystemFs.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const STYLES_DIR = join(ROOT, 'src', 'styles');
const TOKENS_FILE = join(STYLES_DIR, 'tokens.css');

const COLOR_LITERAL_PATTERNS = [
  { name: 'hex colour', re: /#[0-9a-fA-F]{3,8}\b/g },
  { name: 'rgb()', re: /\brgb\(/g },
  { name: 'rgba()', re: /\brgba\(/g },
  { name: 'hsl()', re: /\bhsl\(/g },
  { name: 'hsla()', re: /\bhsla\(/g },
  { name: 'oklch()', re: /\boklch\(/g },
];

const FORBIDDEN_PATTERNS = [
  { name: 'linear-gradient', re: /linear-gradient\(/g },
  { name: 'radial-gradient', re: /radial-gradient\(/g },
  { name: 'conic-gradient', re: /conic-gradient\(/g },
  { name: 'backdrop-filter', re: /backdrop-filter/g },
];

const FORBIDDEN_WORDS = ['violet', 'indigo', 'purple'];

function nonTokensCssFiles() {
  return walk(STYLES_DIR, ['.css']).filter((file) => file !== TOKENS_FILE);
}

function componentAndUtilFiles() {
  return [
    ...walk(join(ROOT, 'src', 'components'), ['.jsx', '.js']),
    ...walk(join(ROOT, 'src', 'views'), ['.jsx', '.js']),
    ...walk(join(ROOT, 'src', 'hooks'), ['.jsx', '.js']),
    ...walk(join(ROOT, 'src', 'utils'), ['.jsx', '.js']),
  ];
}

test('no CSS file outside tokens.css contains a colour literal', () => {
  for (const file of nonTokensCssFiles()) {
    const text = stripComments(readFileSync(file, 'utf8'));
    for (const { name, re } of COLOR_LITERAL_PATTERNS) {
      const matches = text.match(re);
      assert.equal(matches, null, `${file} contains a ${name} literal: ${matches}`);
    }
  }
});

test('no component/hook/util source contains a colour literal', () => {
  for (const file of componentAndUtilFiles()) {
    const text = stripComments(readFileSync(file, 'utf8'));
    for (const { name, re } of COLOR_LITERAL_PATTERNS) {
      const matches = text.match(re);
      assert.equal(matches, null, `${file} contains a ${name} literal: ${matches}`);
    }
  }
});

test('no gradients or backdrop-filter anywhere outside tokens.css', () => {
  for (const file of [...nonTokensCssFiles(), ...componentAndUtilFiles()]) {
    const text = stripComments(readFileSync(file, 'utf8'));
    for (const { name, re } of FORBIDDEN_PATTERNS) {
      const matches = text.match(re);
      assert.equal(matches, null, `${file} contains forbidden ${name}`);
    }
  }
});

test('no off-brand hue (violet, indigo, purple) in any CSS value or class name', () => {
  for (const file of [...nonTokensCssFiles(), ...componentAndUtilFiles()]) {
    const text = stripComments(readFileSync(file, 'utf8')).toLowerCase();
    for (const word of FORBIDDEN_WORDS) {
      assert.equal(text.includes(word), false, `${file} contains the forbidden word "${word}"`);
    }
  }
});

function parseCustomProperties(css, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const blockMatch = css.match(new RegExp(`${escaped}\\s*{([^}]*)}`, 's'));
  assert.ok(blockMatch, `expected a ${selector} block in tokens.css`);
  const props = new Map();
  for (const line of blockMatch[1].split('\n')) {
    const propMatch = line.match(/(--[a-z0-9-]+)\s*:\s*([^;]+);/i);
    if (propMatch) props.set(propMatch[1], propMatch[2].trim());
  }
  return props;
}

// The contract's light table (docs/DESIGN-SYSTEM.md), named once here. The
// dark-theme coverage check below derives its expectations from parsing
// :root instead of hand-listing this same set a second time.
const CONTRACT_LIGHT_TOKENS = [
  '--color-canvas', '--color-surface', '--color-surface-muted', '--color-surface-hover',
  '--color-panel', '--color-panel-raised', '--color-panel-border', '--color-panel-muted',
  '--color-ink', '--color-ink-muted', '--color-ink-faint', '--color-ink-inverse',
  '--color-accent', '--color-accent-strong', '--color-accent-soft', '--color-accent-ink', '--color-accent-line',
  '--color-border', '--color-border-strong',
  '--color-positive', '--color-positive-soft', '--color-positive-text',
  '--color-warning', '--color-warning-soft', '--color-warning-text',
  '--color-danger', '--color-danger-soft', '--color-danger-text',
  '--color-info', '--color-info-soft', '--color-info-text',
  '--color-neutral', '--color-neutral-soft', '--color-neutral-text',
  '--font-sans', '--font-mono',
  '--text-xs', '--text-sm', '--text-base', '--text-md', '--text-lg', '--text-xl', '--text-2xl', '--text-3xl',
  '--space-1', '--space-2', '--space-3', '--space-4', '--space-5', '--space-6',
  '--radius-xs', '--radius-sm', '--radius-md', '--radius-lg',
  '--shadow-sm', '--shadow-float',
  '--duration-fast', '--shell-sidebar', '--control-height', '--row-height', '--page-gutter',
];

// Tokens the contract's dark paragraph does NOT list as changing: the raw
// status hues (only their -soft/-text pairs change in dark) and accent-ink
// (identical in both themes). Everything else --color-* in :root is expected
// to be redefined under [data-theme="dark"].
const NOT_REDEFINED_IN_DARK = new Set([
  '--color-accent-ink',
  '--color-positive',
  '--color-warning',
  '--color-danger',
  '--color-info',
  '--color-neutral',
]);

test('tokens.css defines every token named in the contract light table', () => {
  const css = readFileSync(TOKENS_FILE, 'utf8');
  const root = parseCustomProperties(css, ':root');
  for (const name of CONTRACT_LIGHT_TOKENS) {
    assert.ok(root.has(name), `:root is missing contract token ${name}`);
  }
});

test('[data-theme="dark"] redefines every --color-* token that differs by theme', () => {
  const css = readFileSync(TOKENS_FILE, 'utf8');
  const root = parseCustomProperties(css, ':root');
  const dark = parseCustomProperties(css, '[data-theme="dark"]');

  const rootColorNames = [...root.keys()].filter((name) => name.startsWith('--color-'));
  const expectedToChange = rootColorNames.filter((name) => !NOT_REDEFINED_IN_DARK.has(name));

  for (const name of expectedToChange) {
    assert.ok(dark.has(name), `[data-theme="dark"] does not redefine ${name}, but the light/dark tables give it a different value`);
    assert.notEqual(dark.get(name), root.get(name), `[data-theme="dark"] redefines ${name} to the same value as :root — not a real override`);
  }

  // No orphan tokens: everything dark defines must also exist in :root.
  for (const name of dark.keys()) {
    assert.ok(root.has(name), `[data-theme="dark"] defines ${name}, which :root never declares`);
  }
});

test('color-scheme is declared per theme', () => {
  const css = readFileSync(TOKENS_FILE, 'utf8');
  const rootBlock = css.match(/:root\s*{([^}]*)}/s)[1];
  const darkBlock = css.match(/\[data-theme="dark"\]\s*{([^}]*)}/s)[1];
  assert.match(rootBlock, /color-scheme:\s*light;/);
  assert.match(darkBlock, /color-scheme:\s*dark;/);
});

/* "--color-ink-faint is decorative only — never text" (contract). Caught in
   the browser: nav group labels and stage indices were faint-grey TEXT. Any
   rule that sets `color` to the faint token must be a known decorative glyph. */
const FAINT_COLOR_ALLOWLIST = ['.rail-connector', '.identity-chain__arrow', '.identity-chain__mark--pending'];

test('the faint ink token is only ever the colour of decorative glyphs', () => {
  const offenders = [];
  for (const file of nonTokensCssFiles()) {
    const css = stripComments(readFileSync(file, 'utf8'));
    for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const selector = match[1].trim().replace(/\s+/g, ' ');
      if (!/(^|;|\s)color:\s*var\(--color-ink-faint\)/.test(match[2])) continue;
      const allowed = selector.split(',').every((part) => FAINT_COLOR_ALLOWLIST.some((ok) => part.trim().startsWith(ok)));
      if (!allowed) offenders.push(`${file.replace(ROOT, '')}: ${selector}`);
    }
  }
  assert.deepEqual(offenders, [], 'ink-faint used as a text colour outside the decorative allowlist');
});