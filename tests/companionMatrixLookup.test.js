/* Companion Matrix lookup gate: `resolveLookup()` must agree with
   `isRegistryValid()` on every combination in the cartesian product, must
   never call `resolveDirective()` (which throws) for an invalid one, and
   must always resolve a registry-valid combination to a row number that
   actually exists in `MATRIX_ROWS`. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PARTICIPATION, MODEL_RESULTS, isRegistryValid, MATRIX_ROWS } from '../src/domain/matrix.js';
import { resolveLookup } from '../src/components/companion/matrix/matrixLookup.js';

function* allCombinations() {
  for (const routePresent of [true, false]) {
    for (const participation of PARTICIPATION) {
      for (const modelResult of MODEL_RESULTS) {
        for (const adviseAllowed of [true, false]) {
          yield { routePresent, participation, modelResult, adviseAllowed };
        }
      }
    }
  }
}

test('every registry-valid combination resolves to a row within MATRIX_ROWS', () => {
  let checkedValid = 0;
  for (const combo of allCombinations()) {
    if (!isRegistryValid(combo)) continue;
    const lookup = resolveLookup(combo);
    assert.equal(lookup.valid, true, JSON.stringify(combo));
    assert.ok(lookup.resolved.row >= 1 && lookup.resolved.row <= MATRIX_ROWS.length, JSON.stringify(combo));
    assert.ok(['ACTIVATE_SHARD', 'ADVISE', 'REQUEST_INPUT'].includes(lookup.resolved.directive), JSON.stringify(combo));
    checkedValid += 1;
  }
  assert.ok(checkedValid > 0, 'expected at least one registry-valid combination');
});

test('an invalid combination never reaches resolveDirective (which throws) — it is named instead', () => {
  let checkedInvalid = 0;
  for (const combo of allCombinations()) {
    if (isRegistryValid(combo)) continue;
    // resolveDirective() throws on an invalid combination; resolveLookup()
    // must not propagate that, which is only true if it never called it.
    assert.doesNotThrow(() => resolveLookup(combo), JSON.stringify(combo));
    const lookup = resolveLookup(combo);
    assert.equal(lookup.valid, false, JSON.stringify(combo));
    assert.equal(typeof lookup.invalidRule, 'string', JSON.stringify(combo));
    assert.ok(lookup.invalidRule.length > 0, JSON.stringify(combo));
    checkedInvalid += 1;
  }
  assert.ok(checkedInvalid > 0, 'expected at least one registry-invalid combination');
});

test('resolveLookup never mutates its argument', () => {
  const combo = Object.freeze({ routePresent: true, participation: 'advisory', modelResult: 'actionable', adviseAllowed: true });
  const snapshot = { ...combo };
  resolveLookup(combo);
  assert.deepEqual(combo, snapshot);
});
