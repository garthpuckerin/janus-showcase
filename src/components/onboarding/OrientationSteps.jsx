import { useState } from 'react';
import { BEATS, TOTAL_BEATS } from './beats.js';
import { BeatFigure } from './BeatFigure.jsx';
import { WizardActionBar } from '../companion/advisor/WizardActionBar.jsx';

/**
 * The phone orientation (ISSUE-003): FULL-SCREEN, one beat per screen — this
 * mounts instead of `CompanionShell` while onboarding runs, not on top of
 * it, so there is no bottom tab bar or app bar underneath it. Reuses the
 * Advisor wizard's pinned action bar (`WizardActionBar`) for Next/Back,
 * exactly the one-step-per-screen pattern `AdvisorWizardView` already
 * established; "Skip" is its own ≥44×44 text button in the header, kept out
 * of the pinned bar so it never sits where a thumb expects Back or Next.
 */
export function OrientationSteps({ onFinish }) {
  const [step, setStep] = useState(1);
  const beat = BEATS[step - 1];
  const isLast = step === TOTAL_BEATS;

  const handleNext = () => (isLast ? onFinish() : setStep((current) => current + 1));
  const handleBack = () => setStep((current) => Math.max(1, current - 1));

  return (
    <section className="orientation-steps" aria-labelledby="orientation-steps-heading">
      <div className="orientation-steps__header">
        <p className="orientation-steps__progress mono">
          Step {step} of {TOTAL_BEATS}
        </p>
        <button type="button" className="orientation-steps__skip" onClick={onFinish}>
          Skip
        </button>
      </div>

      <div className="orientation-steps__screen">
        <h1 id="orientation-steps-heading" className="orientation-steps__title">
          {beat.title}
        </h1>
        <p className="orientation-steps__body">{beat.body}</p>
        <div className="orientation-steps__figure">
          <BeatFigure figure={beat.figure} />
        </div>
      </div>

      <WizardActionBar
        primaryLabel={isLast ? 'Open the console' : 'Next'}
        onPrimary={handleNext}
        showBack={step > 1}
        onBack={handleBack}
      />
    </section>
  );
}
