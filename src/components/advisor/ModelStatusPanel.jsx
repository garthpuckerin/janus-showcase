import { modelStatusLabel } from '../../utils/format.js';
import { ADVISOR_POLICY } from './advisorFlow.js';

/** Model status and confidence, read straight off `diagnostics`, compared
 *  against the policy's own floor — never a number typed in this file. */
export function ModelStatusPanel({ diagnostics, matrixRowExplanation }) {
  const { model_status: modelStatus, confidence } = diagnostics;
  const floor = ADVISOR_POLICY.minimum_model_confidence;
  const clearsFloor = confidence !== null && confidence >= floor;

  return (
    <div className="rail-stage">
      <h2 className="rail-stage__heading">Model status</h2>
      <div className="panel">
        <dl>
          <dt>Status</dt>
          <dd title={modelStatus}>{modelStatusLabel(modelStatus)}</dd>
          <dt>Confidence</dt>
          <dd>
            {confidence === null ? (
              <span className="not-applicable">not applicable</span>
            ) : (
              <>
                {confidence} against a floor of {floor} —{' '}
                <strong>{clearsFloor ? 'clears the policy floor' : 'below the policy floor'}</strong>
              </>
            )}
          </dd>
        </dl>
        {matrixRowExplanation && <p className="page-framing">{matrixRowExplanation}</p>}
      </div>
    </div>
  );
}
