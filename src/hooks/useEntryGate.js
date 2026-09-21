import { useCallback, useState } from 'react';
import {
  isDeepLink,
  resolveEntry,
  readEntered,
  readOnboarded,
  enter as applyEnter,
  finishOnboarding as applyFinishOnboarding,
  replay as applyReplay,
  stripGateParams,
} from '../utils/entryGate.js';

function safeStorage(factory) {
  try {
    return factory();
  } catch {
    return null;
  }
}

function currentStorages() {
  return {
    session: safeStorage(() => window.sessionStorage),
    local: safeStorage(() => window.localStorage),
  };
}

function currentSearch() {
  try {
    return window.location.search;
  } catch {
    return '';
  }
}

function computeStage() {
  if (typeof window === 'undefined') return 'app';
  const { session, local } = currentStorages();
  return resolveEntry({
    entered: readEntered(session),
    onboarded: readOnboarded(local),
    deepLink: isDeepLink(currentSearch()),
  });
}

/**
 * The landing/onboarding/app gate (ISSUE-003): reads both storages once, on
 * mount, then only ever moves forward from an explicit user action (`enter`,
 * `finishOnboarding`) or back via `replay`. All storage and history access is
 * wrapped in try/catch — either can throw in a locked-down browser — and the
 * pure resolution this wraps (`utils/entryGate.js`) is unit-tested directly,
 * including the rule that the landing flag never reaches localStorage.
 * @returns {{stage: 'landing'|'onboarding'|'app', enter: () => void, finishOnboarding: () => void, replay: () => void}}
 */
export function useEntryGate() {
  const [stage, setStage] = useState(computeStage);

  const enter = useCallback(() => {
    applyEnter(currentStorages());
    setStage(computeStage());
  }, []);

  const finishOnboarding = useCallback(() => {
    applyFinishOnboarding(currentStorages());
    setStage(computeStage());
  }, []);

  const replay = useCallback(() => {
    applyReplay(currentStorages());
    try {
      const next = stripGateParams(window.location.search);
      window.history.replaceState({}, '', `${window.location.pathname}${next}`);
    } catch {
      // History API blocked — the flags are still cleared, which is what
      // actually decides the stage below.
    }
    setStage(computeStage());
  }, []);

  return { stage, enter, finishOnboarding, replay };
}
