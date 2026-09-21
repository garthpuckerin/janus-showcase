/* Landing/onboarding gate (ISSUE-003, docs/DESIGN-SYSTEM.md "Entry: landing
   and orientation"). Pure resolution only — no DOM, no storage access of its
   own — so it is unit-tested directly; `hooks/useEntryGate.js` wires this to
   `window.sessionStorage`/`localStorage`/the URL.

   `ENTERED_KEY` and `ONBOARDED_KEY` are a contract with the sweep scripts,
   which seed both storages directly under these exact names/values via
   `context.addInitScript` to get past the gate. Do not rename either. */

export const ENTERED_KEY = 'janus:entered';
export const ONBOARDED_KEY = 'janus:onboarded';

const ENTERED_VALUE = '1';
const ONBOARDED_VALUE = 'done';

/** A deep link's promise IS the record (a shared or case-study link must
 *  open exactly what it named), so it always bypasses the gate — the
 *  standing "Mock data · engine is private" notice in the app/top bar
 *  already carries the honesty line. A decision id (`d`) or a route
 *  (`view`, any value, including the literal `desktop` layout switch)
 *  both count, present with any value (including empty). */
export function isDeepLink(search) {
  let params;
  try {
    params = new URLSearchParams(search ?? '');
  } catch {
    return false;
  }
  return params.has('d') || params.has('view');
}

/**
 * Which stage renders: the landing screen, the four-beat orientation, or the
 * app itself.
 * @param {{entered: boolean, onboarded: boolean, deepLink: boolean}} input
 * @returns {'landing'|'onboarding'|'app'}
 */
export function resolveEntry({ entered, onboarded, deepLink }) {
  if (deepLink) return 'app';
  if (!entered) return 'landing';
  if (!onboarded) return 'onboarding';
  return 'app';
}

function safeRead(storage, key) {
  try {
    return storage ? storage.getItem(key) : null;
  } catch {
    return null;
  }
}

function safeWrite(storage, key, value) {
  try {
    storage?.setItem(key, value);
  } catch {
    // Storage blocked (private mode, a locked-down browser, …) — the caller's
    // own React state still moves forward for this session, it just will not
    // survive a reload.
  }
}

function safeRemove(storage, key) {
  try {
    storage?.removeItem(key);
  } catch {
    // Storage blocked — nothing to clear.
  }
}

/** @param {{getItem(key: string): string|null}|null} sessionLike */
export function readEntered(sessionLike) {
  return safeRead(sessionLike, ENTERED_KEY) === ENTERED_VALUE;
}

/** @param {{getItem(key: string): string|null}|null} localLike */
export function readOnboarded(localLike) {
  return safeRead(localLike, ONBOARDED_KEY) === ONBOARDED_VALUE;
}

/** Marks the session as entered. Takes both storages explicitly (rather than
 *  reaching for `window.sessionStorage`/`localStorage` itself) so the
 *  landing flag being sessionStorage-ONLY is a property of this function's
 *  wiring, not a convention — `local` is accepted for a symmetric call shape
 *  with `finishOnboarding`/`replay` but is never read or written here (see
 *  `tests/entryGate.test.js`, which asserts a fake `local` receives zero
 *  calls). A shared link must not silently skip the landing on a later
 *  visit, which localStorage would allow. */
export function enter({ session, local: _local } = {}) {
  safeWrite(session, ENTERED_KEY, ENTERED_VALUE);
}

/** Marks onboarding as complete — Skip and Escape both count as done, so a
 *  reload never re-nags. Persists in `localStorage`: unlike the landing, the
 *  tour is a one-time thing across sessions, not per-visit. */
export function finishOnboarding({ session: _session, local } = {}) {
  safeWrite(local, ONBOARDED_KEY, ONBOARDED_VALUE);
}

/** Clears both flags — Replay is a return to the very first run. */
export function replay({ session, local } = {}) {
  safeRemove(session, ENTERED_KEY);
  safeRemove(local, ONBOARDED_KEY);
}

/** A new search string with the gate-bypassing params (`d`, `view`) removed,
 *  so Replay does not land back on the exact deep link it just cleared the
 *  flags for. Pure string → string; the caller applies it with
 *  `history.replaceState`. */
export function stripGateParams(search) {
  let params;
  try {
    params = new URLSearchParams(search ?? '');
  } catch {
    return '';
  }
  params.delete('d');
  params.delete('view');
  const next = params.toString();
  return next ? `?${next}` : '';
}
