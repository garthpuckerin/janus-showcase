import { DataState } from '../common/DataState.jsx';
import { STEP_STATUS } from './advisorSteps.js';

const NOT_REACHED_MESSAGE = 'Not reached yet — this step depends on the result above it.';
const NOT_NEEDED_MESSAGE = 'Not needed for this outcome — the ask produced advice directly, so there is nothing to hold or clarify.';

/** One numbered card in the Advisor walk (01 Ask · 02 Result · 03
 *  Continuation · 04 Clarify · 05 Result). A step that has not been reached
 *  — or was never going to be, for an outcome with no continuation — still
 *  renders in its slot, as a quiet `DataState` one-liner, never as missing
 *  space. */
export function AdvisorStepCard({ index, title, status, children }) {
  const reached = status === STEP_STATUS.REACHED;
  const headingId = `advisor-step-${index}-heading`;

  return (
    <section className="card advisor-step" aria-labelledby={headingId}>
      <div className="card__header">
        <h2 id={headingId} className="advisor-step__title">
          <span className="advisor-step__index mono" aria-hidden="true">{String(index).padStart(2, '0')}</span>
          {title}
        </h2>
      </div>
      {reached ? (
        children
      ) : (
        <DataState tone="neutral">
          {status === STEP_STATUS.NOT_NEEDED ? NOT_NEEDED_MESSAGE : NOT_REACHED_MESSAGE}
        </DataState>
      )}
    </section>
  );
}
