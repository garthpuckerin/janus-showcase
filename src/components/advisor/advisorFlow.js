/* Pure request-building, evaluation and tampering helpers for the Advisor
   workflow. Nothing here mutates an argument, and every id or event type the
   protocol cares about is a constant read once, not typed again per call
   site. `AdvisorView` composes these; `tests/advisorFlow.test.js` pins them
   directly, independent of React. */
import { evaluate } from '../../domain/evaluate.js';
import { PERSONA_POLICIES, ACTION_POLICIES } from '../../domain/policies.js';

export const ADVISOR_POLICY = PERSONA_POLICIES.find((p) => p.policy_id === 'advisor.business-strategy');
export const ADVISOR_TENANT_ID = 'harbor-cu';
export const ADVISOR_PERSONA_ID = 'strategy-desk';

export const ASK_EVENT_TYPE = 'business.strategy.requested';
export const CLARIFY_EVENT_TYPE = 'business.strategy.clarification.received';

const REGISTRY = Object.freeze({ personaPolicies: PERSONA_POLICIES, actionPolicies: ACTION_POLICIES });

/** Wrap one scripted port result in the `{call()}` shape `evaluate()`
 *  expects, counting calls — the same pattern `src/data/ledger.js` uses, so
 *  every surface in the cockpit can show "the model was called N times" from
 *  a real count, never an assertion. */
export function scriptedPort(result) {
  const state = { count: 0 };
  return {
    call() {
      state.count += 1;
      return result;
    },
    get callCount() {
      return state.count;
    },
  };
}

/** Build the initial "Ask" request. `payload` should already be projected
 *  down to allowlisted fields with present values only. */
export function buildAskRequest({ requestId, payload }) {
  return Object.freeze({
    schema_version: '2.0',
    request_id: requestId,
    persona: {
      type: 'advisor',
      id: ADVISOR_PERSONA_ID,
      policy_id: ADVISOR_POLICY.policy_id,
      policy_version: ADVISOR_POLICY.version,
      context: { tenant_id: ADVISOR_TENANT_ID },
    },
    event: { type: ASK_EVENT_TYPE, payload: Object.freeze({ ...payload }) },
    state: {},
  });
}

/** Build the clarification follow-up request: the same persona, a new
 *  request_id, the clarification event type, and the original payload merged
 *  with the caller's answers. Never mutates `originalRequest`. */
export function buildClarifyRequest(originalRequest, { requestId, answers }) {
  return Object.freeze({
    ...originalRequest,
    request_id: requestId,
    event: Object.freeze({
      type: CLARIFY_EVENT_TYPE,
      payload: Object.freeze({ ...originalRequest.event.payload, ...answers }),
    }),
  });
}

/** Run one request through the real `evaluate()`, scripting the port result
 *  and reporting exactly how many times it was called. */
export function evaluateAdvisorRequest(request, { port, continuation } = {}) {
  const modelPort = port ? scriptedPort(port) : null;
  const evaluation = evaluate(request, REGISTRY, { modelPort: modelPort ?? undefined, continuation });
  return { evaluation, portCallCount: modelPort ? modelPort.callCount : 0 };
}

/* --- Tampering with a caller-held continuation ---------------------------
   Each mode returns a NEW object; the continuation passed in is never
   mutated. Every mode invalidates the continuation's own identity hash (it
   is a function of the continuation's content, so any of these edits makes
   the stored `continuation_id` stop matching), which is exactly why the
   engine's revalidation step fails closed on all three the same way. */

export function tamperAddRequestedField(continuation, field = 'objective') {
  const requested = continuation.requested_fields.includes(field)
    ? continuation.requested_fields
    : [...continuation.requested_fields, field].sort();
  return Object.freeze({ ...continuation, requested_fields: requested });
}

export function tamperBumpPolicyVersion(continuation) {
  return Object.freeze({ ...continuation, persona_policy_version: continuation.persona_policy_version + 1 });
}

export function tamperForgeContinuationId(continuation) {
  return Object.freeze({ ...continuation, continuation_id: `${continuation.continuation_id}-forged` });
}

export const TAMPER_MODES = Object.freeze({
  'add-field': {
    label: 'Add a requested field',
    description: 'Adds "objective" to requested_fields without updating the continuation\'s own identity.',
    apply: (continuation) => tamperAddRequestedField(continuation, 'objective'),
  },
  'bump-version': {
    label: 'Bump persona_policy_version',
    description: 'Claims a policy version one newer than the one that actually minted this continuation.',
    apply: tamperBumpPolicyVersion,
  },
  'forge-id': {
    label: 'Forge continuation_id',
    description: 'Appends to the continuation_id so it no longer matches its own content hash.',
    apply: tamperForgeContinuationId,
  },
});
