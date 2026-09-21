/* Pure surface-resolution gate: which shell renders for a given viewport
   width, `?view=` query value and stored session choice, and which value
   `?view=` yields as a ROUTE. No DOM, no React — see src/utils/surface.js. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveRoute, resolveSurface, SURFACE_FORCE_VALUE } from '../src/utils/surface.js';

const params = (query = '') => new URLSearchParams(query);

test('a narrow viewport with no query or stored value resolves to the companion', () => {
  assert.equal(resolveSurface({ width: 390, searchParams: params(), stored: null }), 'companion');
});

test('a viewport at or above 1024px resolves to the workstation', () => {
  assert.equal(resolveSurface({ width: 1024, searchParams: params(), stored: null }), 'workstation');
  assert.equal(resolveSurface({ width: 1440, searchParams: params(), stored: null }), 'workstation');
});

test('one pixel below the breakpoint still resolves to the companion', () => {
  assert.equal(resolveSurface({ width: 1023, searchParams: params(), stored: null }), 'companion');
});

test('?view=desktop forces the workstation on a narrow viewport', () => {
  assert.equal(
    resolveSurface({ width: 390, searchParams: params('?view=desktop'), stored: null }),
    'workstation',
  );
});

test('a stored force persists the workstation across a render with no query param', () => {
  assert.equal(
    resolveSurface({ width: 390, searchParams: params(), stored: SURFACE_FORCE_VALUE }),
    'workstation',
  );
});

test('clearing the stored force restores the companion on a narrow viewport', () => {
  assert.equal(resolveSurface({ width: 390, searchParams: params(), stored: null }), 'companion');
});

test('a real route in ?view= never forces the workstation', () => {
  assert.equal(
    resolveSurface({ width: 390, searchParams: params('?view=advisor'), stored: null }),
    'companion',
  );
});

test('garbage query and stored values fall back to width alone', () => {
  assert.equal(
    resolveSurface({ width: 390, searchParams: params('?view=not-a-real-value'), stored: 'also-garbage' }),
    'companion',
  );
  assert.equal(
    resolveSurface({ width: 1280, searchParams: params('?view=not-a-real-value'), stored: 'also-garbage' }),
    'workstation',
  );
});

test('resolveSurface tolerates a missing/undefined searchParams', () => {
  assert.equal(resolveSurface({ width: 390, searchParams: null, stored: null }), 'companion');
  assert.equal(resolveSurface({ width: 1280 }), 'workstation');
});

test('resolveRoute: the literal "desktop" layout switch is never returned as a route', () => {
  assert.equal(resolveRoute({ rawView: SURFACE_FORCE_VALUE, fallback: 'decisions' }), 'decisions');
  assert.equal(resolveRoute({ rawView: SURFACE_FORCE_VALUE, fallback: 'attention' }), 'attention');
});

test('resolveRoute: a missing value falls back', () => {
  assert.equal(resolveRoute({ rawView: null, fallback: 'attention' }), 'attention');
  assert.equal(resolveRoute({ rawView: undefined, fallback: 'decisions' }), 'decisions');
});

test('resolveRoute: ?view=advisor is a route on either surface', () => {
  assert.equal(resolveRoute({ rawView: 'advisor', fallback: 'decisions' }), 'advisor');
  assert.equal(resolveRoute({ rawView: 'advisor', fallback: 'attention' }), 'advisor');
});

test('resolveRoute: any other real route value passes through unchanged, even if it equals the fallback', () => {
  assert.equal(resolveRoute({ rawView: 'decisions', fallback: 'decisions' }), 'decisions');
  assert.equal(resolveRoute({ rawView: 'policies', fallback: 'attention' }), 'policies');
});
