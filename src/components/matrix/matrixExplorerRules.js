/* Names the registry rule a combination violates, so the explorer never
   just says "invalid" — it says which of the two closed-form rules the
   combination breaks. Pure, and the rule text lives next to the logic it
   describes so the two can never drift apart. */
import { isRegistryValid, PARTICIPATION, MODEL_RESULTS } from '../../domain/matrix.js';

const RULES = Object.freeze([
  {
    id: 'no-route-needs-participation',
    test: ({ routePresent, participation }) => !routePresent && participation === 'none',
    text: 'An allowed event with no action route must use advisory or required model participation — "none" is not registry-valid without a route.',
  },
  {
    id: 'port-called-mismatch',
    test: ({ participation, modelResult }) => (participation === 'none') !== (modelResult === 'not_called'),
    text: 'The port is never called under "none" participation, and is called exactly once otherwise — this combination claims the opposite.',
  },
]);

/**
 * @returns {string|null} the rule text the combination breaks, or null if it
 *  is registry-valid and reachable.
 */
export function invalidCombinationRule({ routePresent, participation, modelResult }) {
  if (!PARTICIPATION.includes(participation) || !MODEL_RESULTS.includes(modelResult)) {
    return 'Not a recognised participation or model-result value.';
  }
  if (isRegistryValid({ routePresent, participation, modelResult })) return null;
  const combo = { routePresent, participation, modelResult };
  const broken = RULES.find((rule) => rule.test(combo));
  return broken ? broken.text : 'Not a registry-valid combination.';
}
