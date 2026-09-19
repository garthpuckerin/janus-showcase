import { useCallback, useMemo, useRef, useState } from 'react';
import { MATRIX_ROWS } from '../domain/matrix.js';
import { PreMatrixStage } from '../components/detail/PreMatrixStage.jsx';
import { MatrixStage } from '../components/detail/MatrixStage.jsx';
import { DirectiveStage } from '../components/detail/DirectiveStage.jsx';
import { RailConnector } from '../components/detail/RailConnector.jsx';
import { EmptyState } from '../components/common/EmptyState.jsx';
import { AdvisorAskForm } from '../components/advisor/AdvisorAskForm.jsx';
import { AdvisorClarifyForm } from '../components/advisor/AdvisorClarifyForm.jsx';
import { ContinuationCard } from '../components/advisor/ContinuationCard.jsx';
import { WhyCannotActPanel } from '../components/advisor/WhyCannotActPanel.jsx';
import { ModelStatusPanel } from '../components/advisor/ModelStatusPanel.jsx';
import { ADVISOR_PORT_PRESETS, DEFAULT_ADVISOR_PORT_KEY, DEFAULT_ASK_PORT_KEY } from '../components/advisor/advisorPresets.js';
import {
  buildAskRequest,
  buildClarifyRequest,
  evaluateAdvisorRequest,
  TAMPER_MODES,
} from '../components/advisor/advisorFlow.js';

const INITIAL_ASK_VALUES = Object.freeze({
  prompt: 'Should Harbor Credit Union prioritize deposit growth or loan growth over the next fiscal year?',
  objective: '',
  risk_tolerance: '',
  time_horizon_days: '',
});

function projectAskPayload(values) {
  const payload = {};
  for (const [key, raw] of Object.entries(values)) {
    if (raw === '' || raw === undefined || raw === null) continue;
    payload[key] = key === 'time_horizon_days' ? Number(raw) : raw;
  }
  return payload;
}

/** Whatever `evaluate()` produced, mapped to a sentence for the special case
 *  the domain calls the catch-all row: an absent route with any accepted
 *  result other than not_actionable, which resolves the same way regardless
 *  of what the model claimed. Derived from the fired row's own shape, never
 *  a hardcoded row number. */
function matrixRowExplanation(matrixRow) {
  const fired = MATRIX_ROWS.find((row) => row.row === matrixRow);
  if (!fired || fired.route !== 'absent' || fired.modelResult !== 'other') return null;
  return 'No action route exists for this event, so there is no matrix row this candidate can activate — an ' +
    'absent route with any accepted result other than not_actionable resolves to this one fixed REQUEST_INPUT.';
}

export function AdvisorView() {
  const requestSeq = useRef(0);
  const nextRequestId = useCallback(() => {
    requestSeq.current += 1;
    return `req-strategy-live-${requestSeq.current}`;
  }, []);

  const [askValues, setAskValues] = useState(INITIAL_ASK_VALUES);
  const [askPortKey, setAskPortKey] = useState(DEFAULT_ASK_PORT_KEY);
  const [askOutcome, setAskOutcome] = useState(null);

  const [clarifyValues, setClarifyValues] = useState({});
  const [clarifyPortKey, setClarifyPortKey] = useState(DEFAULT_ADVISOR_PORT_KEY);
  const [tamperMode, setTamperMode] = useState('none');
  const [clarifyOutcome, setClarifyOutcome] = useState(null);

  const handleAskFieldChange = useCallback((name, value) => {
    setAskValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleAskSubmit = useCallback(() => {
    const request = buildAskRequest({ requestId: nextRequestId(), payload: projectAskPayload(askValues) });
    const port = ADVISOR_PORT_PRESETS[askPortKey].value;
    const result = evaluateAdvisorRequest(request, { port });
    setAskOutcome({ request, ...result });
    setClarifyOutcome(null);
    setClarifyValues({});
    setTamperMode('none');
  }, [askValues, askPortKey, nextRequestId]);

  const requestedFields = askOutcome?.evaluation.continuation ? askOutcome.evaluation.directive.payload.requested_fields : [];

  const handleClarifyFieldChange = useCallback((name, value) => {
    setClarifyValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleClarifySubmit = useCallback(() => {
    if (!askOutcome?.evaluation.continuation) return;
    const followUp = buildClarifyRequest(askOutcome.request, { requestId: nextRequestId(), answers: clarifyValues });
    const continuation = tamperMode === 'none'
      ? askOutcome.evaluation.continuation
      : TAMPER_MODES[tamperMode].apply(askOutcome.evaluation.continuation);
    const port = ADVISOR_PORT_PRESETS[clarifyPortKey].value;
    const result = evaluateAdvisorRequest(followUp, { port, continuation });
    setClarifyOutcome({ request: followUp, tampered: tamperMode !== 'none', ...result });
  }, [askOutcome, clarifyValues, clarifyPortKey, tamperMode, nextRequestId]);

  const handleReset = useCallback(() => {
    setAskValues(INITIAL_ASK_VALUES);
    setAskPortKey(DEFAULT_ASK_PORT_KEY);
    setAskOutcome(null);
    setClarifyValues({});
    setClarifyPortKey(DEFAULT_ADVISOR_PORT_KEY);
    setTamperMode('none');
    setClarifyOutcome(null);
  }, []);

  const askExplanation = useMemo(
    () => (askOutcome ? matrixRowExplanation(askOutcome.evaluation.diagnostics.matrix_row) : null),
    [askOutcome],
  );
  const clarifyExplanation = useMemo(
    () => (clarifyOutcome ? matrixRowExplanation(clarifyOutcome.evaluation.diagnostics.matrix_row) : null),
    [clarifyOutcome],
  );

  return (
    <section aria-labelledby="advisor-heading">
      <div className="page-header">
        <div>
          <h1 id="advisor-heading">Advisor</h1>
          <p className="page-framing">
            The actionless <code>advisor.business-strategy@1</code> persona: it can advise or ask for more input,
            and it can never activate a shard. Every step below runs the real <code>evaluate()</code>.
          </p>
        </div>
      </div>

      <div className="advisor-layout">
        <div className="advisor-main">
          <AdvisorAskForm
            values={askValues}
            onFieldChange={handleAskFieldChange}
            portKey={askPortKey}
            onPortKeyChange={setAskPortKey}
            onSubmit={handleAskSubmit}
          />

          <div aria-live="polite" className="advisor-results">
            {!askOutcome && <EmptyState message="Ask a question above to run it through evaluate()." />}

            {askOutcome && (
              <div className="advisor-result-block">
                <div className="rail-row">
                  <PreMatrixStage trace={askOutcome.evaluation.trace} />
                  <RailConnector />
                  <MatrixStage
                    matrixRow={askOutcome.evaluation.diagnostics.matrix_row}
                    reached={askOutcome.evaluation.diagnostics.matrix_row !== null}
                  />
                </div>
                <div className="rail-row">
                  <DirectiveStage directive={askOutcome.evaluation.directive} />
                  <RailConnector />
                  <ModelStatusPanel diagnostics={askOutcome.evaluation.diagnostics} matrixRowExplanation={askExplanation} />
                </div>

                {askOutcome.evaluation.continuation && (
                  <>
                    <ContinuationCard continuation={askOutcome.evaluation.continuation} />
                    <AdvisorClarifyForm
                      requestedFields={requestedFields}
                      values={clarifyValues}
                      onFieldChange={handleClarifyFieldChange}
                      portKey={clarifyPortKey}
                      onPortKeyChange={setClarifyPortKey}
                      tamperMode={tamperMode}
                      onTamperModeChange={setTamperMode}
                      onSubmit={handleClarifySubmit}
                    />
                  </>
                )}
              </div>
            )}

            {clarifyOutcome && (
              <div className="advisor-result-block">
                {clarifyOutcome.tampered && (
                  <p className="error-card" role="status">
                    Tampered continuation sent.{' '}
                    {clarifyOutcome.portCallCount === 0 ? (
                      <>
                        <strong>The model was not called</strong> — the continuation is revalidated before model
                        participation, so this one never reached the port.
                      </>
                    ) : (
                      <strong>Unexpected: the model port was called during this evaluation.</strong>
                    )}
                  </p>
                )}
                <div className="rail-row">
                  <PreMatrixStage trace={clarifyOutcome.evaluation.trace} />
                  <RailConnector />
                  <MatrixStage
                    matrixRow={clarifyOutcome.evaluation.diagnostics.matrix_row}
                    reached={clarifyOutcome.evaluation.diagnostics.matrix_row !== null}
                  />
                </div>
                <div className="rail-row">
                  <DirectiveStage directive={clarifyOutcome.evaluation.directive} />
                  <RailConnector />
                  <ModelStatusPanel
                    diagnostics={clarifyOutcome.evaluation.diagnostics}
                    matrixRowExplanation={clarifyExplanation}
                  />
                </div>
                {clarifyOutcome.evaluation.continuation && (
                  <ContinuationCard continuation={clarifyOutcome.evaluation.continuation} />
                )}
              </div>
            )}
          </div>

          <button type="button" className="button button--ghost" onClick={handleReset}>
            Reset
          </button>
        </div>

        <WhyCannotActPanel />
      </div>
    </section>
  );
}
