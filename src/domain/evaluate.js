/* One complete request in, exactly one directive out. Pre-matrix checks fail
   closed to REQUEST_INPUT before the model port is touched; the matrix then
   resolves the directive. The model is a bounded input: it can classify and
   advise, never choose the shard, the action or the inputs. Pure — the
   request is never mutated and nothing is stored. */

import { resolveDirective } from './matrix.js';
import { findActionPolicy } from './policies.js';

/* Names a business input may never use (they belong to the contract). */
export const RESERVED_INPUT_NAMES = Object.freeze([
  'schema_version', 'policy_id', 'policy_version', 'action_policy', 'action_policy_id',
  'action_policy_version', 'input_schema', 'input_allowlist', 'shard', 'shard_id', 'action',
  'request_id', 'directive', 'directive_id', 'ticket', 'ticket_id', 'outcome_id',
  'rejection_id', 'caller_id', 'persona', 'persona_id',
]);

const UNAVAILABLE_STATUSES = ['no_port', 'timeout', 'error', 'invalid_output'];
const isPresent = (v) => v !== undefined && v !== null && !(typeof v === 'string' && v.trim() === '');

/* Deterministic, dependency-free identity (FNV-1a). Illustrative: the point is
   that an id is a function of its content, so a forged one cannot validate. */
function stableId(prefix, parts) {
  let h = 0x811c9dc5;
  for (const ch of JSON.stringify(parts)) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `${prefix}-${h.toString(16).padStart(8, '0')}`;
}

/** Map a port result onto the matrix's model-result axis. */
export function classifyModel(result, minimumConfidence) {
  if (!result || UNAVAILABLE_STATUSES.includes(result.status)) return 'unavailable';
  const { classification, confidence } = result.candidate ?? {};
  if (!['actionable', 'not_actionable', 'needs_input'].includes(classification)) return 'unavailable';
  if (!(confidence >= minimumConfidence)) return 'unavailable';
  return classification;
}

function modelStatus(result, minimumConfidence) {
  if (!result) return 'no_port';
  if (UNAVAILABLE_STATUSES.includes(result.status)) return result.status;
  return classifyModel(result, minimumConfidence) === 'unavailable' ? 'below_threshold' : 'accepted';
}

const continuationIdentity = (c) => stableId('cont', [
  c.source_request_id, c.source_directive_id, c.persona_policy_id, c.persona_policy_version,
  c.originating_event_type, c.route_present, [...c.requested_fields].sort(),
]);

function buildContinuation(request, policy, directive, routePresent, requestedFields) {
  const body = {
    schema_version: '2.0',
    source_request_id: request.request_id,
    source_directive_id: directive.directive_id,
    persona_policy_id: policy.policy_id,
    persona_policy_version: policy.version,
    originating_event_type: request.event.type,
    route_present: routePresent,
    requested_fields: [...requestedFields].sort(),
  };
  return { ...body, continuation_id: continuationIdentity(body) };
}

function continuationProblem(continuation, request, policy, routePresent, allowlist) {
  if (continuation.continuation_id !== continuationIdentity(continuation)) return 'identity';
  if (continuation.persona_policy_id !== policy.policy_id) return 'persona';
  if (continuation.persona_policy_version !== policy.version) return 'policy version';
  if (!policy.allowed_event_types.includes(continuation.originating_event_type)) return 'originating event';
  if (continuation.route_present !== routePresent) return 'route state';
  if (!continuation.requested_fields.every((f) => allowlist.includes(f))) return 'requested fields';
  return null;
}

/**
 * @param request   a DecisionRequestV2-shaped object
 * @param registry  { personaPolicies, actionPolicies }
 * @param options   { modelPort?: {call(projection)}, continuation? }
 * @returns {{directive, diagnostics, continuation?, trace}}
 */
export function evaluate(request, registry, { modelPort, continuation } = {}) {
  const trace = [];
  const step = (check, ok, detail) => { trace.push({ check, ok, detail }); return ok; };

  const finish = (type, payload, diagnostics, mintContinuation) => {
    const directive = {
      schema_version: '2.0',
      directive_id: stableId('dir', [request.request_id, type, payload]),
      request_id: request.request_id,
      type,
      payload,
    };
    const out = { directive, diagnostics, trace };
    return mintContinuation ? { ...out, continuation: mintContinuation(directive) } : out;
  };
  const failClosed = (fields) => finish('REQUEST_INPUT', { requested_fields: [...fields].sort() },
    { model_status: 'not_applicable', confidence: null, matrix_row: null });

  // 1 · persona policy
  const policy = registry.personaPolicies.find(
    (p) => p.policy_id === request.persona.policy_id && p.version === request.persona.policy_version);
  if (!step('persona policy', Boolean(policy), `${request.persona.policy_id}@${request.persona.policy_version}`)) {
    return failClosed(['persona.policy']);
  }

  // 2 · identity and context
  const identityProblems = [
    ...(request.persona.type !== policy.persona_type ? ['persona.type'] : []),
    ...[...policy.required_context_fields].sort()
      .filter((f) => !isPresent(request.persona.context?.[f])).map((f) => `persona.context.${f}`),
  ];
  if (!step('identity and context', identityProblems.length === 0, identityProblems.join(', ') || 'persona type and tenant context present')) {
    return failClosed(identityProblems);
  }

  // 3 · event
  if (!step('event', policy.allowed_event_types.includes(request.event.type), request.event.type)) {
    return failClosed(['event.type']);
  }

  // 4 · route — persona policy owns it; a broken route in an action-capable policy fails closed
  const routes = policy.action_routes.filter((r) => r.event_type === request.event.type);
  const routePresent = routes.length === 1;
  let actionPolicy = null;
  if (routePresent) {
    const [id, version] = routes[0].action_policy_ref.split('@');
    actionPolicy = policy.allowed_action_policy_ids.includes(routes[0].action_policy_ref)
      ? findActionPolicy(registry.actionPolicies, id, Number(version)) : null;
  }
  const routeOk = routes.length <= 1 && (!routePresent || Boolean(actionPolicy));
  if (!step('route', routeOk, routePresent ? routes[0].action_policy_ref : 'no action route (actionless for this event)')) {
    return failClosed(['event.route']);
  }

  // effective allowlist: persona ∩ action for a routed action; persona's own when actionless
  const allowlist = actionPolicy
    ? policy.input_allowlist.filter((f) => actionPolicy.input_allowlist.includes(f))
    : [...policy.input_allowlist];

  // 5 · continuation — revalidated in full before any model participation
  if (continuation) {
    const problem = continuationProblem(continuation, request, policy, routePresent, allowlist);
    if (!step('continuation', problem === null, problem ?? `${continuation.continuation_id} revalidated`)) {
      return failClosed(['continuation']);
    }
  }

  // 6 · input projection — caller extras are dropped, reserved names are refused
  const payload = request.event.payload ?? {};
  const reserved = Object.keys(payload).filter((k) => RESERVED_INPUT_NAMES.includes(k));
  const inputs = Object.fromEntries(
    Object.keys(payload).filter((k) => allowlist.includes(k)).sort().map((k) => [k, payload[k]]));
  const required = [...policy.required_identity_fields, ...(actionPolicy?.required_inputs ?? [])];
  const inputProblems = [...new Set([...reserved, ...required.filter((f) => !isPresent(inputs[f]))])];
  if (!step('input projection', inputProblems.length === 0,
    inputProblems.length ? inputProblems.join(', ') : `${Object.keys(inputs).length} allowlisted field(s) projected`)) {
    return failClosed(inputProblems);
  }

  // model participation — at most one call, and only with the projection
  const participation = policy.model_participation;
  let result = null;
  if (participation !== 'none') {
    result = modelPort ? modelPort.call({ inputs: { ...inputs }, event_type: request.event.type }) : null;
  }
  const modelResult = participation === 'none' ? 'not_called' : classifyModel(result, policy.minimum_model_confidence);
  const adviseAllowed = policy.allowed_directive_types.includes('ADVISE');
  const resolved = resolveDirective({ routePresent, participation, modelResult, adviseAllowed });
  const diagnostics = {
    model_status: participation === 'none' ? 'not_called' : modelStatus(result, policy.minimum_model_confidence),
    confidence: result?.candidate?.confidence ?? null,
    matrix_row: resolved.row,
  };
  step('outcome matrix', true, `row ${resolved.row} → ${resolved.directive}`);

  if (resolved.directive === 'ACTIVATE_SHARD') {
    return finish('ACTIVATE_SHARD', {
      action_policy_id: actionPolicy.policy_id,
      action_policy_version: actionPolicy.version,
      shard_id: actionPolicy.shard_id,
      action: actionPolicy.action,
      inputs,
    }, diagnostics);
  }
  if (resolved.directive === 'ADVISE') {
    return finish('ADVISE', { advice: result.candidate.advice ?? '' }, diagnostics);
  }

  // REQUEST_INPUT from the matrix: only allowlisted fields may be asked for,
  // and only then is a caller-held continuation minted
  const asked = modelResult === 'needs_input'
    ? (result.candidate.requested_fields ?? []).filter((f) => allowlist.includes(f)).sort() : [];
  return finish('REQUEST_INPUT', { requested_fields: asked }, diagnostics, asked.length
    ? (directive) => buildContinuation(request, policy, directive, routePresent, asked) : null);
}
