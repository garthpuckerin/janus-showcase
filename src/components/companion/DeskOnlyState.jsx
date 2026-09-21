import { DataState } from '../common/DataState.jsx';

const COPY = Object.freeze({
  policies: 'Policies stays at the workstation.',
  boundary: 'Boundary stays at the workstation.',
});

/** The shared desk-only state for `DESK_ONLY_VIEWS` routes reached on the
 *  companion: what the surface is, one sentence on why, a primary action
 *  that switches to the desktop layout, and a link back. */
export function DeskOnlyState({ view, onOpenDesktop, onBackToAttention }) {
  return (
    <DataState
      tone="neutral"
      title={COPY[view] ?? 'This is a workstation surface.'}
      action={
        <div className="desk-only-state__actions">
          <button type="button" className="button" onClick={onOpenDesktop}>
            Open the desktop layout
          </button>
          <button type="button" className="button button--ghost" onClick={onBackToAttention}>
            Back to Attention
          </button>
        </div>
      }
    >
      A phone is for triage; policy review needs a workstation.
    </DataState>
  );
}
