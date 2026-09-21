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

/* ---------- The full desktop view on a small device ----------
   "Open the desktop layout" on a phone or a portrait tablet must show the
   REAL desktop: laid out at a desktop width and scaled to the screen, the way
   a browser's "Request desktop site" works. The first version mounted the
   desktop components at the device's own 390px, where the sidebar took the
   full width and content began 534px down a 664px screen — a stacked reflow,
   not the desktop. The layout width below is what the viewport meta is set to
   while the desktop is forced on a narrow device. */
export const FORCED_DESKTOP_LAYOUT_WIDTH = 1280;
export const DEVICE_VIEWPORT_CONTENT = 'width=device-width, initial-scale=1.0, viewport-fit=cover';
export const FORCED_DESKTOP_VIEWPORT_CONTENT = `width=${FORCED_DESKTOP_LAYOUT_WIDTH}, viewport-fit=cover`;

/**
 * The device's own width in CSS px for its CURRENT orientation — independent
 * of the viewport meta, which is exactly what changes when the desktop is
 * forced (after that, `innerWidth` reads 1280 on a phone).
 * @param {{screenWidth: number, screenHeight: number, landscape: boolean}} input
 */
export function deviceWidth({ screenWidth, screenHeight, landscape }) {
  if (!(screenWidth > 0) || !(screenHeight > 0)) return Number.POSITIVE_INFINITY;
  return landscape ? Math.max(screenWidth, screenHeight) : Math.min(screenWidth, screenHeight);
}

/**
 * Which viewport meta content applies: the desktop layout width only when the
 * desktop is forced AND the device itself is narrower than a workstation.
 * A real desktop (or a tablet in landscape) keeps the device viewport.
 * @param {{forced: boolean, deviceWidthPx: number}} input
 */
export function viewportContentFor({ forced, deviceWidthPx }) {
  return forced && !isWorkstationWidth(deviceWidthPx) ? FORCED_DESKTOP_VIEWPORT_CONTENT : DEVICE_VIEWPORT_CONTENT;
}

/* The two list screens a decision can be opened FROM on the phone. */
const DECISION_HOST_VIEWS = Object.freeze(['attention', 'decisions']);

/**
 * Does the companion show a decision's story? A bare deep link
 * (`/?d=<id>`, no `view`) lands on the phone's default view, `attention` —
 * the first version only opened the story under `view=decisions`, so every
 * shared link silently showed the Attention list instead. A decision id
 * opens the story from either list screen; an explicit other tab
 * (advisor, matrix, a desk-only route) wins over a stale id.
 * @param {{view: string, selectedId?: string|null}} input
 */
export function companionShowsDecision({ view, selectedId }) {
  return Boolean(selectedId) && DECISION_HOST_VIEWS.includes(view);
}
