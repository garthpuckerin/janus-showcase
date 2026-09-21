/* Advisor-walk gate: pins the pure step-status derivation the Advisor view
   renders from — independent of React, so it runs without mounting the
   hook. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  STEP,
  STEP_STATUS,
  INITIAL_STEP_STATUSES,
  deriveStepStatuses,
  matrixRowExplanation,
} from '../src/components/advisor/advisorSteps.js';

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

test('initial state reaches only step 01', () => {
  const statuses = deriveStepStatuses({ askOutcome: null, clarifyOutcome: null });
  assert.equal(statuses[STEP.ASK], STEP_STATUS.REACHED);
  assert.equal(statuses[STEP.ASK_RESULT], STEP_STATUS.NOT_REACHED);
  assert.equal(statuses[STEP.CONTINUATION], STEP_STATUS.NOT_REACHED);
  assert.equal(statuses[STEP.CLARIFY], STEP_STATUS.NOT_REACHED);
  assert.equal(statuses[STEP.CLARIFY_RESULT], STEP_STATUS.NOT_REACHED);
});

test('a needs-input result (a minted continuation) reaches 01-04, not yet 05', () => {
  const statuses = deriveStepStatuses({ askOutcome: askOutcomeWithContinuation(), clarifyOutcome: null });
  assert.equal(statuses[STEP.ASK], STEP_STATUS.REACHED);
  assert.equal(statuses[STEP.ASK_RESULT], STEP_STATUS.REACHED);
  assert.equal(statuses[STEP.CONTINUATION], STEP_STATUS.REACHED);
  assert.equal(statuses[STEP.CLARIFY], STEP_STATUS.REACHED);
  assert.equal(statuses[STEP.CLARIFY_RESULT], STEP_STATUS.NOT_REACHED);
});

test('an advice result reaches 01-02 and marks 03-05 not needed', () => {
  const statuses = deriveStepStatuses({ askOutcome: askOutcomeWithoutContinuation(), clarifyOutcome: null });
  assert.equal(statuses[STEP.ASK], STEP_STATUS.REACHED);
  assert.equal(statuses[STEP.ASK_RESULT], STEP_STATUS.REACHED);
  assert.equal(statuses[STEP.CONTINUATION], STEP_STATUS.NOT_NEEDED);
  assert.equal(statuses[STEP.CLARIFY], STEP_STATUS.NOT_NEEDED);
  assert.equal(statuses[STEP.CLARIFY_RESULT], STEP_STATUS.NOT_NEEDED);
});

test('a clarified result reaches all five', () => {
  const statuses = deriveStepStatuses({ askOutcome: askOutcomeWithContinuation(), clarifyOutcome: clarifyOutcome() });
  for (const step of Object.values(STEP)) {
    assert.equal(statuses[step], STEP_STATUS.REACHED, `step ${step}`);
  }
});

test('reset returns to the initial state', () => {
  const resetStatuses = deriveStepStatuses({ askOutcome: null, clarifyOutcome: null });
  assert.deepEqual(resetStatuses, INITIAL_STEP_STATUSES);
});

test('deriveStepStatuses never mutates its inputs', () => {
  const ask = askOutcomeWithContinuation();
  const clarify = clarifyOutcome();
  const askSnapshot = JSON.parse(JSON.stringify(ask));
  const clarifySnapshot = JSON.parse(JSON.stringify(clarify));

  deriveStepStatuses({ askOutcome: ask, clarifyOutcome: clarify });

  assert.deepEqual(ask, askSnapshot);
  assert.deepEqual(clarify, clarifySnapshot);
});

test('matrixRowExplanation only explains the absent-route catch-all row, and never mutates', () => {
  assert.equal(matrixRowExplanation(1), null);
  assert.equal(matrixRowExplanation(null), null);
  assert.match(matrixRowExplanation(11), /absent route/);
});
