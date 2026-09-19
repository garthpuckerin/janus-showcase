/* Matrix-explorer gate: `invalidCombinationRule` must classify every
   combination in the cartesian product the same way `isRegistryValid` does —
   a rule name whenever it's invalid, null whenever it's valid. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PARTICIPATION, MODEL_RESULTS, isRegistryValid } from '../src/domain/matrix.js';
import { invalidCombinationRule } from '../src/components/matrix/matrixExplorerRules.js';

test('every combination in the cartesian product is classified consistently with isRegistryValid', () => {
  let checked = 0;
  for (const routePresent of [true, false]) {
    for (const participation of PARTICIPATION) {
      for (const modelResult of MODEL_RESULTS) {
        const combo = { routePresent, participation, modelResult };
        const rule = invalidCombinationRule(combo);
        if (isRegistryValid(combo)) {
          assert.equal(rule, null, `${JSON.stringify(combo)} is registry-valid but got a rule`);
        } else {
          assert.equal(typeof rule, 'string', `${JSON.stringify(combo)} is registry-invalid but got no rule`);
          assert.ok(rule.length > 0, JSON.stringify(combo));
        }
        checked += 1;
      }
    }
  }
  assert.equal(checked, 2 * PARTICIPATION.length * MODEL_RESULTS.length);
});

test('an unrecognised participation or model result is named as such', () => {
  assert.match(
    invalidCombinationRule({ routePresent: true, participation: 'bogus', modelResult: 'not_called' }),
    /recognised/,
  );
});
