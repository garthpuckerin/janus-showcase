/* Pure resolvers for the theme/density preference — no DOM, no storage
 * access, so they can be unit-tested directly. The rule for both: a valid
 * `?key=` query parameter always wins (this is how `?theme=dark` forces
 * the dark theme for the reveal wall / OG card capture); otherwise a valid
 * stored value is used; anything else falls back to the documented default. */

function resolvePreference({ searchParams, paramKey, stored, validValues, fallback }) {
  const param = searchParams?.get?.(paramKey) ?? null;
  if (validValues.includes(param)) return param;
  if (validValues.includes(stored)) return stored;
  return fallback;
}

export const THEME_VALUES = Object.freeze(['light', 'dark']);
export const DENSITY_VALUES = Object.freeze(['comfortable', 'dense']);

/** Default theme is light; `?theme=dark` (or `?theme=light`) wins over any
 * stored value; an invalid or missing param falls back to the stored value,
 * then to light. */
export function resolveInitialTheme({ searchParams, stored } = {}) {
  return resolvePreference({
    searchParams,
    paramKey: 'theme',
    stored,
    validValues: THEME_VALUES,
    fallback: 'light',
  });
}

/** Same rule as theme, for information density. Default is comfortable. */
export function resolveInitialDensity({ searchParams, stored } = {}) {
  return resolvePreference({
    searchParams,
    paramKey: 'density',
    stored,
    validValues: DENSITY_VALUES,
    fallback: 'comfortable',
  });
}
