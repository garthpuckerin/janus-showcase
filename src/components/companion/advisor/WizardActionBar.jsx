/** The wizard's one pinned primary action, fixed directly above the bottom
 *  tab bar — full width, safe-area aware. A secondary "Back" sits beside it
 *  where going back makes sense. Both clear 48px.
 *
 *  Always a plain `type="button"`, never `type="submit" form="…"`: this
 *  button is reused across every step (it never unmounts), and swapping it
 *  to a submitting button whose `form` target changes on the SAME click that
 *  advances the step is a real browser hazard, not a hypothetical one — the
 *  browser resolves a click's default action against the button's attributes
 *  AFTER synchronous React state updates from that same click have already
 *  re-rendered it, so a step-advancing click can silently submit the NEXT
 *  step's form the instant it appears. `onPrimary` is always a plain click
 *  handler; the Ask/Clarify steps' own `<form onSubmit>` still means Enter in
 *  a text field submits, independent of this button. */
export function WizardActionBar({ primaryLabel, onPrimary, showBack, onBack }) {
  return (
    <div className="wizard-actionbar">
      {showBack && (
        <button type="button" className="button button--secondary wizard-actionbar__back" onClick={onBack}>
          Back
        </button>
      )}
      <button type="button" className="button wizard-actionbar__primary" onClick={onPrimary}>
        {primaryLabel}
      </button>
    </div>
  );
}
