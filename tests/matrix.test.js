/* Matrix gate. The table below is the protocol's "total evaluation outcome
   matrix", row for row. The cockpit's resolver must reproduce every row, and
   must be TOTAL: any registry-valid combination yields exactly one directive. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DIRECTIVES,
  MODEL_RESULTS,
  PARTICIPATION,
  MATRIX_ROWS,
  resolveDirective,
  isRegistryValid,
} from '../src/domain/matrix.js';

const { ADVISE, ACTIVATE_SHARD, REQUEST_INPUT } = DIRECTIVES;

/* route, participation, model result, directive when ADVISE allowed, when not */
const PROTOCOL_TABLE = [
  ['present', 'none',     'not_called',     ACTIVATE_SHARD, ACTIVATE_SHARD],
  ['present', 'advisory', 'unavailable',    ACTIVATE_SHARD, ACTIVATE_SHARD],
  ['present', 'advisory', 'actionable',     ACTIVATE_SHARD, ACTIVATE_SHARD],
  ['present', 'advisory', 'not_actionable', ADVISE,         ACTIVATE_SHARD],
  ['present', 'advisory', 'needs_input',    REQUEST_INPUT,  REQUEST_INPUT],
  ['present', 'required', 'unavailable',    REQUEST_INPUT,  REQUEST_INPUT],
  ['present', 'required', 'actionable',     ACTIVATE_SHARD, ACTIVATE_SHARD],
  ['present', 'required', 'not_actionable', ADVISE,         REQUEST_INPUT],
  ['present', 'required', 'needs_input',    REQUEST_INPUT,  REQUEST_INPUT],
  ['absent',  'advisory', 'not_actionable', ADVISE,         REQUEST_INPUT],
  ['absent',  'required', 'not_actionable', ADVISE,         REQUEST_INPUT],
];

test('every protocol row resolves to the protocol directive', () => {
  for (const [route, participation, modelResult, whenAllowed, whenNot] of PROTOCOL_TABLE) {
    const base = { routePresent: route === 'present', participation, modelResult };
    assert.equal(resolveDirective({ ...base, adviseAllowed: true }).directive, whenAllowed,
      `${route}/${participation}/${modelResult} with ADVISE allowed`);
    assert.equal(resolveDirective({ ...base, adviseAllowed: false }).directive, whenNot,
      `${route}/${participation}/${modelResult} with ADVISE not allowed`);
  }
});

test('absent route: every result other than not_actionable requests input', () => {
  for (const participation of ['advisory', 'required']) {
    for (const modelResult of ['unavailable', 'actionable', 'needs_input']) {
      for (const adviseAllowed of [true, false]) {
        const { directive } = resolveDirective({ routePresent: false, participation, modelResult, adviseAllowed });
        assert.equal(directive, REQUEST_INPUT, `absent/${participation}/${modelResult}`);
      }
    }
  }
});

test('an actionless persona can never activate, whatever the model says', () => {
  for (const participation of ['advisory', 'required']) {
    for (const modelResult of MODEL_RESULTS.filter((r) => r !== 'not_called')) {
      for (const adviseAllowed of [true, false]) {
        const { directive } = resolveDirective({ routePresent: false, participation, modelResult, adviseAllowed });
        assert.notEqual(directive, ACTIVATE_SHARD);
      }
    }
  }
});

test('the resolver is total over registry-valid combinations', () => {
  let combos = 0;
  for (const routePresent of [true, false]) {
    for (const participation of PARTICIPATION) {
      for (const modelResult of MODEL_RESULTS) {
        const combo = { routePresent, participation, modelResult };
        if (!isRegistryValid(combo)) continue;
        for (const adviseAllowed of [true, false]) {
          const out = resolveDirective({ ...combo, adviseAllowed });
          assert.ok(Object.values(DIRECTIVES).includes(out.directive), JSON.stringify(combo));
          assert.ok(Number.isInteger(out.row) && out.row >= 1 && out.row <= MATRIX_ROWS.length);
          combos++;
        }
      }
    }
  }
  assert.ok(combos > 0);
});

test('registry-invalid combinations are refused, never resolved', () => {
  // an allowed event with no route may not use participation "none"
  assert.equal(isRegistryValid({ routePresent: false, participation: 'none', modelResult: 'not_called' }), false);
  // the port is not called under "none", and is always called otherwise
  assert.equal(isRegistryValid({ routePresent: true, participation: 'none', modelResult: 'actionable' }), false);
  assert.equal(isRegistryValid({ routePresent: true, participation: 'advisory', modelResult: 'not_called' }), false);
  assert.throws(() => resolveDirective({ routePresent: false, participation: 'none', modelResult: 'not_called', adviseAllowed: true }));
});

test('the published row list matches the protocol table one to one', () => {
  assert.equal(MATRIX_ROWS.length, 11);
  const key = (r) => `${r.route}|${r.participation.join('+')}|${r.modelResult}`;
  assert.equal(new Set(MATRIX_ROWS.map(key)).size, 11);
});
