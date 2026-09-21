/* Pure resolvers for theme/density (src/utils/preferences.js) — no DOM, no
 * storage. Covers: default; a valid query param winning over a stored
 * value; a stored value used when there's no param; garbage falling back
 * to the default. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveInitialTheme, resolveInitialDensity } from '../src/utils/preferences.js';

function params(query) {
  return new URLSearchParams(query);
}

test('theme defaults to light with no param and no stored value', () => {
  assert.equal(resolveInitialTheme({ searchParams: params(''), stored: null }), 'light');
});

test('?theme=dark wins over a stored light value', () => {
  assert.equal(resolveInitialTheme({ searchParams: params('theme=dark'), stored: 'light' }), 'dark');
});

test('a stored theme is used when there is no param', () => {
  assert.equal(resolveInitialTheme({ searchParams: params(''), stored: 'dark' }), 'dark');
});

test('a garbage theme param and a garbage stored value both fall back to light', () => {
  assert.equal(resolveInitialTheme({ searchParams: params('theme=neon'), stored: 'not-a-theme' }), 'light');
});

test('a garbage theme param falls back to a valid stored value', () => {
  assert.equal(resolveInitialTheme({ searchParams: params('theme=neon'), stored: 'dark' }), 'dark');
});

test('density defaults to comfortable with no param and no stored value', () => {
  assert.equal(resolveInitialDensity({ searchParams: params(''), stored: null }), 'comfortable');
});

test('?density=dense wins over a stored comfortable value', () => {
  assert.equal(resolveInitialDensity({ searchParams: params('density=dense'), stored: 'comfortable' }), 'dense');
});

test('a stored density is used when there is no param', () => {
  assert.equal(resolveInitialDensity({ searchParams: params(''), stored: 'dense' }), 'dense');
});

test('a garbage density param and a garbage stored value both fall back to comfortable', () => {
  assert.equal(resolveInitialDensity({ searchParams: params('density=huge'), stored: 'roomy' }), 'comfortable');
});
