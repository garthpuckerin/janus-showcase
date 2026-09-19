import { useEffect, useState } from 'react';

/** A brief, deliberate skeleton window on first paint — even though the mock
 *  ledger resolves synchronously, a screen that never shows a loading state
 *  is a screen that never demonstrates it has one. */
export function usePageReady(delay = 120) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
    const timer = window.setTimeout(() => setReady(true), delay);
    return () => window.clearTimeout(timer);
  }, [delay]);

  return ready;
}
