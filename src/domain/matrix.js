/* The total evaluation outcome matrix, as the v2 protocol publishes it.
   One module feeds the Matrix explorer, the decision traces and the ledger —
   no view resolves a directive on its own. */

export const DIRECTIVES = Object.freeze({
  ADVISE: 'ADVISE',
  ACTIVATE_SHARD: 'ACTIVATE_SHARD',
  REQUEST_INPUT: 'REQUEST_INPUT',
});

export const PARTICIPATION = Object.freeze(['none', 'advisory', 'required']);

/* not_called      — participation "none": the port is never invoked
   unavailable     — no port, timeout, port error, invalid output, or a
                     candidate below the policy's minimum confidence
   actionable / not_actionable / needs_input — an accepted candidate's class */
export const MODEL_RESULTS = Object.freeze([
  'not_called', 'unavailable', 'actionable', 'not_actionable', 'needs_input',
]);

const { ADVISE, ACTIVATE_SHARD, REQUEST_INPUT } = DIRECTIVES;

/* `directive` is the result when ADVISE is in the persona's directive
   allowlist; `fallback` is the result when it is not (null = same). */
export const MATRIX_ROWS = Object.freeze([
  { row: 1,  route: 'present', participation: ['none'],                 modelResult: 'not_called',     directive: ACTIVATE_SHARD, fallback: null },
  { row: 2,  route: 'present', participation: ['advisory'],             modelResult: 'unavailable',    directive: ACTIVATE_SHARD, fallback: null },
  { row: 3,  route: 'present', participation: ['advisory'],             modelResult: 'actionable',     directive: ACTIVATE_SHARD, fallback: null },
  { row: 4,  route: 'present', participation: ['advisory'],             modelResult: 'not_actionable', directive: ADVISE,         fallback: ACTIVATE_SHARD },
  { row: 5,  route: 'present', participation: ['advisory'],             modelResult: 'needs_input',    directive: REQUEST_INPUT,  fallback: null },
  { row: 6,  route: 'present', participation: ['required'],             modelResult: 'unavailable',    directive: REQUEST_INPUT,  fallback: null },
  { row: 7,  route: 'present', participation: ['required'],             modelResult: 'actionable',     directive: ACTIVATE_SHARD, fallback: null },
  { row: 8,  route: 'present', participation: ['required'],             modelResult: 'not_actionable', directive: ADVISE,         fallback: REQUEST_INPUT },
  { row: 9,  route: 'present', participation: ['required'],             modelResult: 'needs_input',    directive: REQUEST_INPUT,  fallback: null },
  { row: 10, route: 'absent',  participation: ['advisory', 'required'], modelResult: 'not_actionable', directive: ADVISE,         fallback: REQUEST_INPUT },
  { row: 11, route: 'absent',  participation: ['advisory', 'required'], modelResult: 'other',          directive: REQUEST_INPUT,  fallback: null },
].map(Object.freeze));

/** A combination the policy registry would accept and the engine could reach. */
export function isRegistryValid({ routePresent, participation, modelResult }) {
  if (!PARTICIPATION.includes(participation) || !MODEL_RESULTS.includes(modelResult)) return false;
  // an allowed event with no action route must use advisory or required
  if (!routePresent && participation === 'none') return false;
  // the port is not called under "none", and is called exactly once otherwise
  return (participation === 'none') === (modelResult === 'not_called');
}

function findRow({ routePresent, participation, modelResult }) {
  const route = routePresent ? 'present' : 'absent';
  return MATRIX_ROWS.find((r) =>
    r.route === route
    && r.participation.includes(participation)
    && (r.modelResult === modelResult || r.modelResult === 'other'));
}

/** Resolve one registry-valid combination to exactly one directive. */
export function resolveDirective({ routePresent, participation, modelResult, adviseAllowed }) {
  const combo = { routePresent, participation, modelResult };
  if (!isRegistryValid(combo)) {
    throw new Error(`Not a registry-valid combination: ${JSON.stringify(combo)}`);
  }
  const hit = findRow(combo);
  const directive = adviseAllowed || hit.fallback === null ? hit.directive : hit.fallback;
  return { row: hit.row, directive, usedFallback: directive !== hit.directive };
}
