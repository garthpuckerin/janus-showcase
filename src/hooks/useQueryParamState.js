import { useEffect, useState } from 'react';

function readParam(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  const params = new URLSearchParams(window.location.search);
  return params.get(key) ?? fallback;
}

/** Mirror one piece of view state to a `?key=` query parameter, both ways. */
export function useQueryParamState(key, fallback) {
  const [value, setValue] = useState(() => readParam(key, fallback));

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (value === fallback || value === null || value === undefined) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    const query = params.toString();
    const url = `${window.location.pathname}${query ? `?${query}` : ''}`;
    window.history.replaceState({}, '', url);
  }, [key, value, fallback]);

  useEffect(() => {
    const onPopState = () => setValue(readParam(key, fallback));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [key, fallback]);

  return [value, setValue];
}
