/* Companion Advisor wizard gate: pins `wizardModel()` (the phone wizard's
   step-to-screen routing on top of the same `deriveStepStatuses()` the
   desktop Advisor renders from), `whyCannotAct()` against both canonical
   persona policies, and `resultSentence()`'s derivation. Independent of
   React. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STEP, INITIAL_STEP_STATUSES, deriveStepStatuses } from '../src/components/advisor/advisorSteps.js';
import { wizardModel, PRIMARY_ACTION } from '../src/components/companion/advisor/wizardModel.js';
import { whyCannotAct } from '../src/components/companion/advisor/whyCannotAct.js';
import { resultSentence } from '../src/components/companion/advisor/resultSentence.js';
import { PERSONA_POLICIES } from '../src/domain/policies.js';
import { DIRECTIVES } from '../src/domain/matrix.js';

function askOutcomeWithContinuation() {
  return Object.freeze({
    request: Object.freeze({}),
    evaluation: Object.freeze({
      continuation: Object.freeze({ continuation_id: 'cont-1' }),
      diagnostics: Object.freeze({ matrix_row: 9 }),
      directive: Object.freeze({ type: 'REQUEST_INPUT', payload: Object.freeze({ requested_fields: ['risk_tolerance'] }) }),
    }),
    portCallCount: 1,
  });
}

function askOutcomeWithoutContinuation() {
  return Object.freeze({
    request: Object.freeze({}),
    evaluation: Object.freeze({
      continuation: undefined,
      diagnostics: Object.freeze({ matrix_row: 4 }),
      directive: Object.freeze({ type: 'ADVISE', payload: Object.freeze({}) }),
    }),
    portCallCount: 1,
  });
}

function clarifyOutcome() {
  return Object.freeze({
    request: Object.freeze({}),
    evaluation: Object.freeze({ diagnostics: Object.freeze({ matrix_row: 8 }) }),
    portCallCount: 1,
  });
}

test('wizardModel: initial state is step 1 of 5 with "Evaluate", cannot go back', () => {
  const model = wizardModel({ stepStatuses: INITIAL_STEP_STATUSES, requestedStep: STEP.ASK });
  assert.equal(model.current, 1);
  assert.equal(model.total, 5);
  assert.equal(model.primaryAction, PRIMARY_ACTION.EVALUATE);
  assert.equal(model.canGoBack, false);
});

test('wizardModel: totals come from the steps module, not a typed constant', () => {
  const model = wizardModel({ stepStatuses: INITIAL_STEP_STATUSES });
  assert.equal(model.total, Object.keys(STEP).length);
});

test('wizardModel: a needs-input walk reaches the continuation step next, and all five steps are eventually reachable', () => {
  const statuses = deriveStepStatuses({ askOutcome: askOutcomeWithContinuation(), clarifyOutcome: null });

  // Requesting step 3 (Continuation) while it is reached shows it.
  const atContinuation = wizardModel({ stepStatuses: statuses, requestedStep: STEP.CONTINUATION });
  assert.equal(atContinuation.current, STEP.CONTINUATION);
  assert.equal(atContinuation.primaryAction, PRIMARY_ACTION.CONTINUE);

  // Requesting step 5 before a clarify result exists is clamped back to the
  // furthest reached step (4) — the UI cannot jump ahead of the walk.
  const beforeClarifyResult = wizardModel({ stepStatuses: statuses, requestedStep: STEP.CLARIFY_RESULT });
  assert.equal(beforeClarifyResult.current, STEP.CLARIFY);

  // Once the clarify result exists, step 5 is reachable.
  const withClarifyResult = deriveStepStatuses({ askOutcome: askOutcomeWithContinuation(), clarifyOutcome: clarifyOutcome() });
  const atResult = wizardModel({ stepStatuses: withClarifyResult, requestedStep: STEP.CLARIFY_RESULT });
  assert.equal(atResult.current, STEP.CLARIFY_RESULT);
  assert.equal(atResult.primaryAction, PRIMARY_ACTION.START_OVER);
  assert.deepEqual(atResult.reached, [1, 2, 3, 4, 5]);
});

test('wizardModel: an advice result ends the walk at step 2, marks 3-5 not needed, "Start over"', () => {
  const statuses = deriveStepStatuses({ askOutcome: askOutcomeWithoutContinuation(), clarifyOutcome: null });
  const model = wizardModel({ stepStatuses: statuses, requestedStep: STEP.CLARIFY_RESULT });
  assert.equal(model.current, STEP.ASK_RESULT);
  assert.equal(model.primaryAction, PRIMARY_ACTION.START_OVER);
  assert.deepEqual(model.notNeeded, [3, 4, 5]);
});

test('wizardModel: REQUEST_INPUT with no continuation also ends at step 2', () => {
  const noContinuationRequestInput = Object.freeze({
    evaluation: Object.freeze({ continuation: undefined, diagnostics: Object.freeze({ matrix_row: 11 }) }),
  });
  const statuses = deriveStepStatuses({ askOutcome: noContinuationRequestInput, clarifyOutcome: null });
  // Requesting the furthest possible step still clamps to what was actually
  // reached — there is no continuation, so nothing past step 2 exists.
  const model = wizardModel({ stepStatuses: statuses, requestedStep: STEP.CLARIFY_RESULT });
  assert.equal(model.current, STEP.ASK_RESULT);
  assert.equal(model.primaryAction, PRIMARY_ACTION.START_OVER);
});

test('wizardModel never mutates stepStatuses', () => {
  const statuses = deriveStepStatuses({ askOutcome: askOutcomeWithContinuation(), clarifyOutcome: null });
  const snapshot = JSON.parse(JSON.stringify(statuses));
  wizardModel({ stepStatuses: statuses, requestedStep: STEP.CLARIFY });
  assert.deepEqual(statuses, snapshot);
});

test('whyCannotAct: the advisor persona (no action routes) cannot activate a shard', () => {
  const advisor = PERSONA_POLICIES.find((p) => p.policy_id === 'advisor.business-strategy');
  const facts = whyCannotAct(advisor);
  assert.equal(facts.actionRouteCount, 0);
  assert.equal(facts.canActivateShard, false);
  assert.equal(facts.modelParticipation, advisor.model_participation);
  assert.equal(facts.minimumModelConfidence, advisor.minimum_model_confidence);
});

test('whyCannotAct: the routed audience persona can activate a shard', () => {
  const audience = PERSONA_POLICIES.find((p) => p.policy_id === 'audience.crm-contact-upsert');
  const facts = whyCannotAct(audience);
  assert.equal(facts.actionRouteCount, 1);
  assert.equal(facts.canActivateShard, true);
});

test('whyCannotAct never mutates the policy record', () => {
  const advisor = PERSONA_POLICIES.find((p) => p.policy_id === 'advisor.business-strategy');
  const snapshot = JSON.parse(JSON.stringify(advisor));
  whyCannotAct(advisor);
  assert.deepEqual(JSON.parse(JSON.stringify(advisor)), snapshot);
});

test('resultSentence: prefers the hook\'s own explanation when it applies', () => {
  const sentence = resultSentence({ directiveType: DIRECTIVES.REQUEST_INPUT, hasContinuation: false, explanation: 'row 11 explanation' });
  assert.equal(sentence, 'row 11 explanation');
});

test('resultSentence: distinguishes REQUEST_INPUT with and without a continuation', () => {
  const withContinuation = resultSentence({ directiveType: DIRECTIVES.REQUEST_INPUT, hasContinuation: true, explanation: null });
  const withoutContinuation = resultSentence({ directiveType: DIRECTIVES.REQUEST_INPUT, hasContinuation: false, explanation: null });
  assert.notEqual(withContinuation, withoutContinuation);
  assert.match(withContinuation, /asking for more input/);
  assert.match(withoutContinuation, /ends here without a continuation/);
});

test('resultSentence: ADVISE gets its own sentence', () => {
  assert.match(resultSentence({ directiveType: DIRECTIVES.ADVISE, hasContinuation: false, explanation: null }), /advice/);
});
