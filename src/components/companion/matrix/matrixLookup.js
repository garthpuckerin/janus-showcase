/* Pure resolution for the phone Matrix lookup: a registry-valid combination
   resolves to a directive (via the domain's own `resolveDirective`); an
   invalid one is named by `invalidCombinationRule` and NEVER handed to
   `resolveDirective`, which throws on an invalid combination — this wrapper
   is what keeps that call conditional in exactly one place. Never mutates
   `combo`. */
import { isRegistryValid, resolveDirective } from '../../../domain/matrix.js';
import { invalidCombinationRule } from '../../matrix/matrixExplorerRules.js';

/**
 * @param {{routePresent: boolean, participation: string, modelResult: string, adviseAllowed: boolean}} combo
 * @returns {{valid: true, resolved: {row: number, directive: string, usedFallback: boolean}}
 *          | {valid: false, invalidRule: string}}
 */
export function resolveLookup(combo) {
  if (!isRegistryValid(combo)) {
    return Object.freeze({ valid: false, invalidRule: invalidCombinationRule(combo) });
  }
  return Object.freeze({ valid: true, resolved: resolveDirective(combo) });
}
