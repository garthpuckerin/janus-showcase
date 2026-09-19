/* Advisor-flow gate: pins the request-building and tampering helpers the
   Advisor view is built from, independent of React. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ADVISOR_POLICY,
  ASK_EVENT_TYPE,
  CLARIFY_EVENT_TYPE,
  buildAskRequest,
  buildClarifyRequest,
  evaluateAdvisorRequest,
  TAMPER_MODES,
} from '../src/components/advisor/advisorFlow.js';

function askRequest(overrides = {}) {
  return buildAskRequest({
    requestId: 'req-strategy-live-1',
    payload: { prompt: 'Should Harbor Credit Union open a second branch this year?' },
    ...overrides,
  });
}

const NEEDS_INPUT_PORT = {
  status: 'ok',
  candidate: { classification: 'needs_input', confidence: 0.8, requested_fields: ['risk_tolerance'] },
};

const ADVICE_PORT = {
  status: 'ok',
  candidate: { classification: 'not_actionable', confidence: 0.9, advice: 'Pilot before committing.' },
};

test('the follow-up request carries a new request_id, the clarification event type and the same persona', () => {
  const original = askRequest();
  const followUp = buildClarifyRequest(original, {
    requestId: 'req-strategy-live-2',
    answers: { risk_tolerance: 'moderate' },
  });

  assert.notEqual(followUp.request_id, original.request_id);
  assert.equal(followUp.request_id, 'req-strategy-live-2');
  assert.equal(followUp.event.type, CLARIFY_EVENT_TYPE);
  assert.notEqual(followUp.event.type, ASK_EVENT_TYPE);
  assert.deepEqual(followUp.persona, original.persona);
  assert.equal(followUp.event.payload.prompt, original.event.payload.prompt);
  assert.equal(followUp.event.payload.risk_tolerance, 'moderate');
});

test('buildClarifyRequest never mutates the original request', () => {
  const original = askRequest();
  const snapshot = JSON.parse(JSON.stringify(original));
  buildClarifyRequest(original, { requestId: 'req-strategy-live-2', answers: { risk_tolerance: 'high' } });
  assert.deepEqual(original, snapshot);
});

test('a valid continuation, answered, yields ADVISE with exactly one port call', () => {
  const askedRequest = askRequest();
  const ask = evaluateAdvisorRequest(askedRequest, { port: NEEDS_INPUT_PORT });
  assert.equal(ask.evaluation.directive.type, 'REQUEST_INPUT');
  assert.ok(ask.evaluation.continuation, 'a needs_input result must mint a continuation');
  assert.equal(ask.portCallCount, 1);

  const followUp = buildClarifyRequest(askedRequest, {
    requestId: 'req-strategy-live-2',
    answers: { risk_tolerance: 'moderate' },
  });
  const clarified = evaluateAdvisorRequest(followUp, { port: ADVICE_PORT, continuation: ask.evaluation.continuation });

  assert.equal(clarified.evaluation.directive.type, 'ADVISE');
  assert.equal(clarified.portCallCount, 1);
});

test('every tamper mode fails closed: REQUEST_INPUT for continuation, no continuation, zero port calls', () => {
  const askedRequest = askRequest();
  const ask = evaluateAdvisorRequest(askedRequest, { port: NEEDS_INPUT_PORT });
  const followUp = buildClarifyRequest(askedRequest, {
    requestId: 'req-strategy-live-2',
    answers: { risk_tolerance: 'moderate' },
  });

  for (const [mode, tamper] of Object.entries(TAMPER_MODES)) {
    const tampered = tamper.apply(ask.evaluation.continuation);
    const result = evaluateAdvisorRequest(followUp, { port: ADVICE_PORT, continuation: tampered });

    assert.equal(result.evaluation.directive.type, 'REQUEST_INPUT', mode);
    assert.deepEqual(result.evaluation.directive.payload.requested_fields, ['continuation'], mode);
    assert.equal(result.evaluation.continuation, undefined, `${mode} must mint no replacement continuation`);
    assert.equal(result.portCallCount, 0, `${mode} must never call the model`);
  }
});

test('tampering never mutates the original continuation', () => {
  const ask = evaluateAdvisorRequest(askRequest(), { port: NEEDS_INPUT_PORT });
  const original = ask.evaluation.continuation;
  const snapshot = JSON.parse(JSON.stringify(original));

  for (const tamper of Object.values(TAMPER_MODES)) {
    tamper.apply(original);
  }

  assert.deepEqual(original, snapshot);
});

test('the advisor persona policy backs these fixtures (sanity)', () => {
  assert.equal(ADVISOR_POLICY.policy_id, 'advisor.business-strategy');
  assert.equal(ADVISOR_POLICY.action_routes.length, 0);
});
