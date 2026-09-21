import { CheckCircle2, XCircle } from 'lucide-react';

/** Stage 02's body: the trace list — icon, check name, the engine's detail
 *  string in mono. `evaluate()` fails closed at the first problem, so a
 *  failed row is always the last row in `trace`: there is nothing after it
 *  to mark "not reached" (see detail.css's note on `.trace-item--fail`). */
export function PreMatrixBody({ trace }) {
  return (
    <ul className="trace-list">
      {trace.map((step, index) => (
        <li
          key={`${step.check}-${index}`}
          className={`trace-item ${step.ok ? 'trace-item--pass' : 'trace-item--fail'}`}
        >
          {step.ok ? (
            <CheckCircle2 size={16} className="trace-item__icon" aria-hidden="true" />
          ) : (
            <XCircle size={16} className="trace-item__icon" aria-hidden="true" />
          )}
          <span>
            <strong>{step.check}</strong>
            {step.detail ? (
              <>
                {' — '}
                <span className="mono">{step.detail}</span>
              </>
            ) : null}
          </span>
        </li>
      ))}
    </ul>
  );
}
