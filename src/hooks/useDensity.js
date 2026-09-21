import { useCallback, useEffect, useState } from 'react';
import { resolveInitialDensity } from '../utils/preferences.js';

const STORAGE_KEY = 'janus:density';

function readStoredDensity() {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredDensity(value) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Storage blocked — density still applies for this session via state.
  }
}

function initialDensity() {
  if (typeof window === 'undefined') return 'comfortable';
  const searchParams = new URLSearchParams(window.location.search);
  return resolveInitialDensity({ searchParams, stored: readStoredDensity() });
}

/** Density lives on `document.documentElement` as `data-density`. Default is
 * comfortable; the user's choice persists in `sessionStorage` only. */
export function useDensity() {
  const [density, setDensityState] = useState(initialDensity);

  useEffect(() => {
    document.documentElement.setAttribute('data-density', density);
  }, [density]);

  const setDensity = useCallback((next) => {
    setDensityState(next);
    writeStoredDensity(next);
  }, []);

  return [density, setDensity];
}
