import { useEffect, useId, useRef, useState } from 'react';
import { BEATS, TOTAL_BEATS } from './beats.js';
import { BeatFigure } from './BeatFigure.jsx';

const FOCUSABLE_SELECTOR = 'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * The desktop orientation (ISSUE-003): a centred modal, NOT a spotlight
 * tour — the four beats are self-contained content, not callouts pointing at
 * live UI. `orientation-dialog` is a distinguishing class the mobile sweep
 * uses to prove this component never mounts on the phone (`OrientationSteps`
 * is a separate, full-screen component there). Focus is trapped inside while
 * open and restored to whatever had it on close; Escape finishes the tour,
 * same as Skip — both count as "seen it", never a re-nag on reload.
 */
export function OrientationDialog({ onFinish }) {
  const [step, setStep] = useState(1);
  const headingId = useId();
  const dialogRef = useRef(null);
  const lastFocusedRef = useRef(null);

  const beat = BEATS[step - 1];
  const isLast = step === TOTAL_BEATS;

  useEffect(() => {
    lastFocusedRef.current = document.activeElement;
    dialogRef.current?.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onFinish();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = [...(dialogRef.current?.querySelectorAll(FOCUSABLE_SELECTOR) ?? [])];
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (lastFocusedRef.current instanceof HTMLElement) lastFocusedRef.current.focus();
    };
  }, [onFinish]);

  const handleNext = () => (isLast ? onFinish() : setStep((current) => current + 1));
  const handleBack = () => setStep((current) => Math.max(1, current - 1));

  return (
    <div className="orientation-dialog__scrim" role="presentation">
      <div
        ref={dialogRef}
        className="orientation-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        tabIndex={-1}
      >
        <p className="orientation-dialog__step mono">
          Step {step} of {TOTAL_BEATS}
        </p>
        <h2 id={headingId} className="orientation-dialog__title">
          {beat.title}
        </h2>
        <p className="orientation-dialog__body">{beat.body}</p>
        <div className="orientation-dialog__figure">
          <BeatFigure figure={beat.figure} />
        </div>

        <div className="orientation-dialog__actions">
          <button type="button" className="button button--ghost orientation-dialog__skip" onClick={onFinish}>
            Skip
          </button>
          <div className="orientation-dialog__nav">
            {step > 1 && (
              <button type="button" className="button button--secondary" onClick={handleBack}>
                Back
              </button>
            )}
            <button type="button" className="button orientation-dialog__next" onClick={handleNext}>
              {isLast ? 'Open the console' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
