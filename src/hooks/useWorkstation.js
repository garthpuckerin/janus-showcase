import { useCallback, useEffect, useState } from 'react';
import { isWorkstationWidth, resolveSurface, SURFACE_FORCE_VALUE, SURFACE_STORAGE_KEY } from '../utils/surface.js';

function readStoredForce() {
  try {
    return window.sessionStorage.getItem(SURFACE_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredForce(value) {
  try {
    if (value === null) window.sessionStorage.removeItem(SURFACE_STORAGE_KEY);
    else window.sessionStorage.setItem(SURFACE_STORAGE_KEY, value);
  } catch {
    // Storage blocked (private mode, locked-down browser, etc.) — the forced
    // layout still applies for this session via React state, it just won't
    // survive a reload.
  }
}

function currentSearchParams() {
  try {
    return new URLSearchParams(window.location.search);
  } catch {
    return null;
  }
}

const MEDIA_QUERY = '(min-width: 1024px)';

/**
 * Which shell renders: the companion shell (phone/tablet) or the workstation
 * shell (desktop, or a narrow viewport that asked for it via `?view=desktop`
 * or a stored choice from earlier in the session). Pure resolution lives in
 * `utils/surface.js`; this hook wires it to the viewport (via
 * `matchMedia`, cleaned up on unmount), the query string (read once, on
 * mount) and `sessionStorage`.
 * @returns {{isWorkstation: boolean, forceDesktop: () => void, clearForceDesktop: () => void, forcedOnNarrowViewport: boolean}}
 */
export function useWorkstation() {
  const [width, setWidth] = useState(() => (typeof window === 'undefined' ? 0 : window.innerWidth));
  const [stored, setStored] = useState(() => (typeof window === 'undefined' ? null : readStoredForce()));

  // `?view=desktop` forces the workstation shell for the rest of the
  // session, the same way a stored choice does. Read once on mount — after
  // that, the stored value (or an explicit clear) is the source of truth.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const queried = currentSearchParams()?.get('view') ?? null;
    if (queried === SURFACE_FORCE_VALUE && stored !== SURFACE_FORCE_VALUE) {
      writeStoredForce(SURFACE_FORCE_VALUE);
      setStored(SURFACE_FORCE_VALUE);
    }
    // Intentionally mount-only: this seeds the session from the URL once,
    // it does not re-run on every stored-value change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mediaQueryList = window.matchMedia(MEDIA_QUERY);
    const onChange = () => setWidth(window.innerWidth);
    mediaQueryList.addEventListener('change', onChange);
    return () => mediaQueryList.removeEventListener('change', onChange);
  }, []);

  const isWorkstation = resolveSurface({ width, searchParams: currentSearchParams(), stored }) === 'workstation';

  const forceDesktop = useCallback(() => {
    writeStoredForce(SURFACE_FORCE_VALUE);
    setStored(SURFACE_FORCE_VALUE);
  }, []);

  const clearForceDesktop = useCallback(() => {
    writeStoredForce(null);
    setStored(null);
  }, []);

  return {
    isWorkstation,
    forceDesktop,
    clearForceDesktop,
    // "Back to the phone layout" (TopBar) only ever makes sense when the
    // desktop shell is on screen BECAUSE of a forced choice, not because the
    // viewport is natively wide.
    forcedOnNarrowViewport: stored === SURFACE_FORCE_VALUE && !isWorkstationWidth(width),
  };
}
