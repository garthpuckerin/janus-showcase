import { useCallback, useEffect, useState } from 'react';
import { resolveInitialTheme } from '../utils/preferences.js';

const STORAGE_KEY = 'janus:theme';

function readStoredTheme() {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredTheme(value) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Storage blocked (private mode, locked-down browser, etc.) — the theme
    // still applies for this session via React state, it just won't persist.
  }
}

function initialTheme() {
  if (typeof window === 'undefined') return 'light';
  const searchParams = new URLSearchParams(window.location.search);
  return resolveInitialTheme({ searchParams, stored: readStoredTheme() });
}

/** Theme lives on `document.documentElement` as `data-theme`, mirrored here
 * so components can read the current value. Default is light; `?theme=dark`
 * forces dark and wins over any stored choice; the user's own choice
 * persists in `sessionStorage` only. */
export function useTheme() {
  const [theme, setThemeState] = useState(initialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const setTheme = useCallback((next) => {
    setThemeState(next);
    writeStoredTheme(next);
  }, []);

  return [theme, setTheme];
}
