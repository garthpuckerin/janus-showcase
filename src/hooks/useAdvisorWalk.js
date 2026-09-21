/* The Advisor screen's whole ask → clarify → tamper state machine, extracted
   out of the view so `AdvisorView.jsx` only renders. Built entirely on the
   pure functions `src/components/advisor/advisorFlow.js` already exports —
   this hook adds no evaluation logic of its own, only React state and the
   handlers that call those functions. */
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  buildAskRequest,
  buildClarifyRequest,
  evaluateAdvisorRequest,
  TAMPER_MODES,
} from '../components/advisor/advisorFlow.js';
import { ADVISOR_PORT_PRESETS, DEFAULT_ADVISOR_PORT_KEY, DEFAULT_ASK_PORT_KEY } from '../components/advisor/advisorPresets.js';
import { deriveStepStatuses, matrixRowExplanation } from '../components/advisor/advisorSteps.js';

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

export function useAdvisorWalk() {
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

  // Nothing to reset until something differs from the opening state — the
  // Reset button is disabled on it rather than being a live control that does
  // nothing.
  const isPristine =
    askOutcome === null &&
    clarifyOutcome === null &&
    askPortKey === DEFAULT_ASK_PORT_KEY &&
    clarifyPortKey === DEFAULT_ADVISOR_PORT_KEY &&
    tamperMode === 'none' &&
    Object.keys(clarifyValues).length === 0 &&
    Object.entries(INITIAL_ASK_VALUES).every(([key, value]) => askValues[key] === value);

  const askExplanation = useMemo(
    () => (askOutcome ? matrixRowExplanation(askOutcome.evaluation.diagnostics.matrix_row) : null),
    [askOutcome],
  );
  const clarifyExplanation = useMemo(
    () => (clarifyOutcome ? matrixRowExplanation(clarifyOutcome.evaluation.diagnostics.matrix_row) : null),
    [clarifyOutcome],
  );

  const stepStatuses = useMemo(() => deriveStepStatuses({ askOutcome, clarifyOutcome }), [askOutcome, clarifyOutcome]);

  return {
    askValues,
    askPortKey,
    setAskPortKey,
    askOutcome,
    askExplanation,
    clarifyValues,
    clarifyPortKey,
    setClarifyPortKey,
    tamperMode,
    setTamperMode,
    clarifyOutcome,
    clarifyExplanation,
    requestedFields,
    stepStatuses,
    handleAskFieldChange,
    handleAskSubmit,
    handleClarifyFieldChange,
    handleClarifySubmit,
    handleReset,
    isPristine,
  };
}
