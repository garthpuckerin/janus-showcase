import { SURFACE_FORCE_VALUE } from '../../../utils/surface.js';

/**
 * No re-run controls on the phone: one line, and a link to this same
 * decision on the desktop layout. `CompanionShell.jsx` never threads
 * `onForceDesktop` this deep, and a second `useWorkstation()` hook instance
 * here could write `sessionStorage` but could not make `App`'s own instance
 * re-render — so this builds the exact URL `useWorkstation` already reads on
 * mount (`?view=desktop`, the literal `SURFACE_FORCE_VALUE`) with `?d=`
 * pointing at this scenario, and navigates there directly.
 */
export function StoryDeskLink({ scenarioId }) {
  const openDesktop = () => {
    const params = new URLSearchParams(window.location.search);
    params.set('view', SURFACE_FORCE_VALUE);
    params.set('d', scenarioId);
    window.location.assign(`${window.location.pathname}?${params.toString()}`);
  };

  return (
    <div className="story-rerun">
      <p className="page-framing">Re-running a request against a different caller is a workstation action.</p>
      <button type="button" className="button button--ghost" onClick={openDesktop}>
        Open the desktop layout
      </button>
    </div>
  );
}
