import { COMPOSED_RUNTIME_STEPS } from '../../data/ownership.js';

/** The composed runtime's five-step sequence, read entirely off
 *  `COMPOSED_RUNTIME_STEPS`. Each step carries a mono two-digit index; a
 *  step whose own `side` is `'fabric'` (authorize, execute) renders on a
 *  `--color-panel-raised` chip instead of the light card the rest of the
 *  sequence sits on, so the sequence itself visibly crosses the seam. */
export function CompositedRuntime() {
  return (
    <div className="card boundary-runtime">
      <div className="card__header">
        <span className="eyebrow">Composed runtime</span>
      </div>
      <ol className="boundary-runtime-steps">
        {COMPOSED_RUNTIME_STEPS.map((step, index) => (
          <li
            key={step.id}
            className={`boundary-runtime-step${step.side === 'fabric' ? ' boundary-runtime-step--fabric' : ''}`}
          >
            <span className="boundary-runtime-step__index mono" aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="boundary-runtime-step__label">{step.label}</span>
            <p className="boundary-runtime-step__description">{step.description}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
