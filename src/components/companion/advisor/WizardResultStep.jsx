import { DirectiveChip } from '../../common/DirectiveChip.jsx';
import { Payload } from '../../common/Payload.jsx';
import { modelStatusLabel } from '../../../utils/format.js';
import { ADVISOR_POLICY } from '../../advisor/advisorFlow.js';
import { MATRIX_ROWS } from '../../../domain/matrix.js';
import { resultSentence } from './resultSentence.js';
import { WizardTrace } from './WizardTrace.jsx';

/** A Result step (step 02 or step 05 of the wizard): the directive at a
 *  glance, one derived sentence, model status, the fired matrix row as a
 *  label/value block (never the table), and the directive / pre-matrix
 *  checks behind their own `<details>`. Shared by both result screens so
 *  this markup exists exactly once. */
export function WizardResultStep({ heading, evaluation, explanation, tamperBanner }) {
  const { directive, diagnostics, trace } = evaluation;
  const floor = ADVISOR_POLICY.minimum_model_confidence;
  const clearsFloor = diagnostics.confidence !== null && diagnostics.confidence >= floor;
  const hasContinuation = Boolean(evaluation.continuation);
  const sentence = resultSentence({ directiveType: directive.type, hasContinuation, explanation });

  return (
    <div className="advisor-wizard__screen">
      <h2 className="advisor-wizard__heading">{heading}</h2>

      {tamperBanner}

      <div className="wizard-result__chip">
        <DirectiveChip type={directive.type} />
      </div>
      <p className="page-framing">{sentence}</p>

      <dl className="wizard-kv">
        <dt>Model status</dt>
        <dd className="mono" title={diagnostics.model_status}>{modelStatusLabel(diagnostics.model_status)}</dd>
        <dt>Confidence</dt>
        <dd className="mono tabular-num">
          {diagnostics.confidence === null ? (
            <span className="not-applicable">not applicable</span>
          ) : (
            <>
              {diagnostics.confidence} against a floor of {floor} — {clearsFloor ? 'meets the floor' : 'below the floor'}
            </>
          )}
        </dd>
        <dt>Outcome matrix row</dt>
        <dd className="mono tabular-num">
          {diagnostics.matrix_row === null ? (
            <span className="not-applicable">not reached</span>
          ) : (
            <>Row {diagnostics.matrix_row} of {MATRIX_ROWS.length}</>
          )}
        </dd>
      </dl>

      <details className="advisor-wizard__details">
        <summary>Show DirectiveV2</summary>
        <Payload caption="DirectiveV2" value={directive} />
      </details>

      <details className="advisor-wizard__details">
        <summary>Show the checks</summary>
        <WizardTrace trace={trace} />
      </details>
    </div>
  );
}
