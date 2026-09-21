/* Pure resolvers for which SHELL renders (companion vs workstation) and
 * which ROUTE is active — no DOM, no storage, so both are unit-tested
 * directly (tests/surface.test.js). `?view=` is shared by two different
 * concerns: it is the existing route param (`?view=advisor`, `?view=policies`
 * …) AND, when its value is the literal string `desktop`, a one-way layout
 * switch that forces the workstation shell on a narrow viewport. The two
 * resolvers below keep that overload from ever leaking into a route: the
 * literal value `desktop` never comes back out of `resolveRoute`. */

/** The literal `?view=` value that means "render the workstation shell",
 *  never a route. */
export const SURFACE_FORCE_VALUE = 'desktop';

/** sessionStorage key the forced choice persists under for the session. */
export const SURFACE_STORAGE_KEY = 'janus:surface';

/** The breakpoint below which the app is a phone/tablet, per the design
 *  system: below 1024px is the companion shell (with a two-column feed
 *  between 768–1023px, unless `?view=desktop`), 1024px and up is the
 *  workstation shell. */
export function isWorkstationWidth(width) {
  return typeof width === 'number' && width >= 1024;
}

/**
 * Which shell renders for a given viewport width, `?view=` query value and
 * stored session choice. A valid `?view=desktop` OR a stored `desktop`
 * forces the workstation shell regardless of width; otherwise width alone
 * decides.
 * @param {{width?: number, searchParams?: URLSearchParams|null, stored?: string|null}} input
 * @returns {'workstation'|'companion'}
 */
export function resolveSurface({ width, searchParams, stored } = {}) {
  const queried = searchParams?.get?.('view') ?? null;
  const forced = queried === SURFACE_FORCE_VALUE || stored === SURFACE_FORCE_VALUE;
  if (forced) return 'workstation';
  return isWorkstationWidth(width) ? 'workstation' : 'companion';
}

/**
 * The `?view=` value as a ROUTE: the literal layout-switch value `desktop`,
 * and a missing/garbage value, both fall back to the given default. Any
 * other value (including one that happens to equal the default) passes
 * through unchanged — it is a real route on both surfaces.
 * @param {{rawView?: string|null, fallback: string}} input
 */
export function resolveRoute({ rawView, fallback }) {
  if (rawView === null || rawView === undefined || rawView === SURFACE_FORCE_VALUE) return fallback;
  return rawView;
}
