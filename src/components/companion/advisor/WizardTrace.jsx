import { CheckCircle2, XCircle } from 'lucide-react';

/** The pre-matrix checks, one row per check — the wizard's own rendering of
 *  `evaluation.trace`, reusing the shared `.trace-list` / `.trace-item`
 *  vocabulary (`src/styles/detail.css`) rather than the desktop's
 *  `PreMatrixStage` component. */
export function WizardTrace({ trace }) {
  return (
    <ul className="trace-list">
      {trace.map((step, index) => (
        <li key={`${step.check}-${index}`} className={`trace-item ${step.ok ? 'trace-item--pass' : 'trace-item--fail'}`}>
          {step.ok ? (
            <CheckCircle2 size={16} className="trace-item__icon" aria-hidden="true" />
          ) : (
            <XCircle size={16} className="trace-item__icon" aria-hidden="true" />
          )}
          <span>
            <strong>{step.check}</strong>
            {step.detail ? ` — ${step.detail}` : ''}
          </span>
        </li>
      ))}
    </ul>
  );
}
