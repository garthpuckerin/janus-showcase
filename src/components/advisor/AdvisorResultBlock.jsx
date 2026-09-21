import { PreMatrixStage } from '../detail/PreMatrixStage.jsx';
import { MatrixStage } from '../detail/MatrixStage.jsx';
import { DirectiveStage } from '../detail/DirectiveStage.jsx';
import { RailConnector } from '../detail/RailConnector.jsx';
import { ModelStatusPanel } from './ModelStatusPanel.jsx';

/** The pre-matrix checks → outcome matrix → directive → model-status rail
 *  for one `evaluate()` outcome. Shared by the Ask result (step 02) and the
 *  Clarify result (step 05) so this markup exists exactly once. */
export function AdvisorResultBlock({ evaluation, explanation }) {
  return (
    <div className="advisor-result-block">
      <div className="rail-row">
        <PreMatrixStage trace={evaluation.trace} />
        <RailConnector />
        <MatrixStage
          matrixRow={evaluation.diagnostics.matrix_row}
          reached={evaluation.diagnostics.matrix_row !== null}
        />
      </div>
      <div className="rail-row">
        <DirectiveStage directive={evaluation.directive} />
        <RailConnector />
        <ModelStatusPanel diagnostics={evaluation.diagnostics} matrixRowExplanation={explanation} />
      </div>
    </div>
  );
}
