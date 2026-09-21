/** The wizard's slim progress header: "Step N of M" plus a segmented rule —
 *  complete steps positive, the current step ink, everything else a plain
 *  border. Every number is read off `wizardModel()`, never typed here. The
 *  rule is `aria-hidden`: the text label already says the same thing.
 *
 *  "Complete" here means the wizard has already stepped PAST it (`step <
 *  current`) — not merely that `deriveStepStatuses()` says the data for it
 *  already exists. A continuation mints steps 03-04 as REACHED the moment
 *  the ask resolves, before the operator has looked at either screen; using
 *  that directly would paint an unvisited step green while still sitting on
 *  an earlier one. */
function toneFor(step, current) {
  if (step === current) return 'current';
  if (step < current) return 'complete';
  return 'upcoming';
}

export function WizardProgress({ current, total, notNeeded }) {
  const steps = Array.from({ length: total }, (_, index) => index + 1);

  return (
    <div className="wizard-progress">
      <p className="wizard-progress__label mono">
        Step {current} of {total}
      </p>
      <div className="wizard-progress__rule" aria-hidden="true">
        {steps.map((step) => (
          <span
            key={step}
            className={`wizard-progress__segment wizard-progress__segment--${toneFor(step, current)}`}
          />
        ))}
      </div>
      {notNeeded.length > 0 && (
        <p className="wizard-progress__note">
          Step{notNeeded.length > 1 ? 's' : ''} {notNeeded[0]}
          {notNeeded.length > 1 ? `–${notNeeded[notNeeded.length - 1]}` : ''} not needed for this outcome.
        </p>
      )}
    </div>
  );
}
