/* Entry gate (ISSUE-003, docs/DESIGN-SYSTEM.md "Entry: landing and
   orientation"). Pure resolution only — `useEntryGate` wires this to
   sessionStorage/localStorage/the URL and is not unit-tested directly (no
   DOM here, by design; see `tests/surface.test.js` for the same pattern).

   The landing flag (`ENTERED_KEY`) MUST be sessionStorage-only, never
   localStorage — a shared link should not silently skip the landing on a
   later visit. Rather than mock `window.localStorage` globally, `enter()`
   takes independent, injected storage-like objects and this test asserts
   the `local` one is never called at all. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ENTERED_KEY,
  ONBOARDED_KEY,
  isDeepLink,
  resolveEntry,
  readEntered,
  readOnboarded,
  enter,
  finishOnboarding,
  replay,
  stripGateParams,
} from '../src/utils/entryGate.js';

/* A minimal Storage-shaped fake that records every call it receives, so a
   test can assert what was — and was not — invoked on it. */
function fakeStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  const calls = [];
  return {
    calls,
    getItem(key) {
      calls.push(['getItem', key]);
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      calls.push(['setItem', key, value]);
      data.set(key, value);
    },
    removeItem(key) {
      calls.push(['removeItem', key]);
      data.delete(key);
    },
  };
}

function throwingStorage() {
  return {
    getItem() { throw new Error('storage blocked'); },
    setItem() { throw new Error('storage blocked'); },
    removeItem() { throw new Error('storage blocked'); },
  };
}

test('ENTERED_KEY and ONBOARDED_KEY are the exact contract names', () => {
  assert.equal(ENTERED_KEY, 'janus:entered');
  assert.equal(ONBOARDED_KEY, 'janus:onboarded');
});

test('isDeepLink: a `d` param is a deep link, any value', () => {
  assert.equal(isDeepLink('?d=lead-activates'), true);
  assert.equal(isDeepLink('?d='), true);
  assert.equal(isDeepLink('d=x'), true);
});

test('isDeepLink: a `view` param is a deep link, any value including `desktop`', () => {
  assert.equal(isDeepLink('?view=advisor'), true);
  assert.equal(isDeepLink('?view=desktop'), true);
  assert.equal(isDeepLink('?view='), true);
});

test('isDeepLink: neither param present is not a deep link', () => {
  assert.equal(isDeepLink(''), false);
  assert.equal(isDeepLink('?other=1'), false);
  assert.equal(isDeepLink(null), false);
  assert.equal(isDeepLink(undefined), false);
});

test('isDeepLink: both params, or garbage input, never throws', () => {
  assert.equal(isDeepLink('?d=x&view=matrix'), true);
  assert.equal(isDeepLink('not a query string'), false);
});

test('resolveEntry: a deep link always resolves to app, regardless of entered/onboarded', () => {
  for (const entered of [true, false]) {
    for (const onboarded of [true, false]) {
      assert.equal(resolveEntry({ entered, onboarded, deepLink: true }), 'app');
    }
  }
});

test('resolveEntry: not entered, no deep link -> landing', () => {
  assert.equal(resolveEntry({ entered: false, onboarded: false, deepLink: false }), 'landing');
  assert.equal(resolveEntry({ entered: false, onboarded: true, deepLink: false }), 'landing');
});

test('resolveEntry: entered and not onboarded, no deep link -> onboarding', () => {
  assert.equal(resolveEntry({ entered: true, onboarded: false, deepLink: false }), 'onboarding');
});

test('resolveEntry: entered and onboarded, no deep link -> app', () => {
  assert.equal(resolveEntry({ entered: true, onboarded: true, deepLink: false }), 'app');
});

test('readEntered / readOnboarded read the exact contract values', () => {
  assert.equal(readEntered(fakeStorage({ [ENTERED_KEY]: '1' })), true);
  assert.equal(readEntered(fakeStorage({ [ENTERED_KEY]: 'yes' })), false);
  assert.equal(readEntered(fakeStorage()), false);
  assert.equal(readOnboarded(fakeStorage({ [ONBOARDED_KEY]: 'done' })), true);
  assert.equal(readOnboarded(fakeStorage({ [ONBOARDED_KEY]: '1' })), false);
});

test('readEntered / readOnboarded never throw when storage access throws', () => {
  assert.equal(readEntered(throwingStorage()), false);
  assert.equal(readOnboarded(throwingStorage()), false);
  assert.equal(readEntered(null), false);
  assert.equal(readOnboarded(undefined), false);
});

test('enter() writes the entered flag to `session` ONLY — `local` receives zero calls', () => {
  const session = fakeStorage();
  const local = fakeStorage();
  enter({ session, local });
  assert.deepEqual(session.calls, [['setItem', ENTERED_KEY, '1']]);
  assert.deepEqual(local.calls, [], 'the entered flag must never touch a localStorage-shaped object');
  assert.equal(readEntered(session), true);
});

test('enter() never throws when session storage is blocked', () => {
  assert.doesNotThrow(() => enter({ session: throwingStorage(), local: fakeStorage() }));
});

test('finishOnboarding() writes the onboarded flag to `local` ONLY — `session` receives zero calls', () => {
  const session = fakeStorage();
  const local = fakeStorage();
  finishOnboarding({ session, local });
  assert.deepEqual(local.calls, [['setItem', ONBOARDED_KEY, 'done']]);
  assert.deepEqual(session.calls, [], 'onboarding completion must never touch the sessionStorage-shaped object');
  assert.equal(readOnboarded(local), true);
});

test('finishOnboarding() never throws when local storage is blocked', () => {
  assert.doesNotThrow(() => finishOnboarding({ session: fakeStorage(), local: throwingStorage() }));
});

test('replay() clears both flags', () => {
  const session = fakeStorage({ [ENTERED_KEY]: '1' });
  const local = fakeStorage({ [ONBOARDED_KEY]: 'done' });
  replay({ session, local });
  assert.equal(readEntered(session), false);
  assert.equal(readOnboarded(local), false);
});

test('replay() never throws when both storages are blocked', () => {
  assert.doesNotThrow(() => replay({ session: throwingStorage(), local: throwingStorage() }));
});

test('stripGateParams removes `d` and `view`, keeps everything else', () => {
  assert.equal(stripGateParams('?d=lead-activates&other=1'), '?other=1');
  assert.equal(stripGateParams('?view=desktop'), '');
  assert.equal(stripGateParams('?view=advisor&d=x'), '');
  assert.equal(stripGateParams(''), '');
  assert.equal(stripGateParams(null), '');
});
