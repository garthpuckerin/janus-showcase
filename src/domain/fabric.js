/* The execution fabric's side of the boundary, as the v2 protocol describes
   it. The decision engine never runs this: a separate system validates the
   trusted caller, derives the least-authority ticket, or rejects before any
   ticket exists. Pure — nothing here mutates its arguments. */

import { AUTHORITY_LEVELS, findActionPolicy } from './policies.js';

export const REJECTION_CODES = Object.freeze([
  'invalid_json', 'invalid_directive', 'unsupported_directive', 'unknown_policy',
  'unsupported_policy', 'policy_mismatch', 'unknown_shard', 'missing_trusted_scope',
  'insufficient_authority', 'caller_context_mismatch', 'invalid_inputs',
]);

const REJECTION_MESSAGES = Object.freeze({
  invalid_directive: 'Activation payload does not match directive type.',
  unsupported_directive: 'Fabric executes ACTIVATE_SHARD directives only.',
  caller_context_mismatch: 'Trusted caller context is bound to another request.',
  unknown_policy: 'The requested action policy version is unavailable.',
  policy_mismatch: 'Activation execution identity differs from policy.',
  invalid_inputs: 'Activation inputs do not satisfy the action policy.',
  missing_trusted_scope: 'Trusted caller grants omit policy-required scopes.',
  insufficient_authority: 'Trusted caller authority is below the policy requirement.',
  unknown_shard: 'The policy-owned shard is not registered.',
});

const reject = (directive, code, details) => ({
  kind: 'rejection',
  rejection: {
    schema_version: '2.0',
    code,
    message: REJECTION_MESSAGES[code],
    request_id: directive.request_id,
    directive_id: directive.directive_id,
    ...(details ? { details } : {}),
  },
});

function invalidInputFields(inputs, policy) {
  const extras = Object.keys(inputs).filter((k) => !policy.input_allowlist.includes(k));
  const missing = policy.required_inputs.filter((k) => inputs[k] === undefined || inputs[k] === '');
  return [...extras, ...missing].sort();
}

/**
 * Validate one directive against trusted caller context and derive its ticket.
 * Checks run in the fabric's order; the first failure rejects and no ticket exists.
 * @returns {{kind:'ticket', ticket:object} | {kind:'rejection', rejection:object}}
 */
export function deriveTicket(directive, trustedContext, { actionPolicies, registeredShards, ticketId }) {
  if (directive.type !== 'ACTIVATE_SHARD') return reject(directive, 'unsupported_directive');
  const payload = directive.payload;
  if (!payload || !payload.action_policy_id) return reject(directive, 'invalid_directive');
  if (trustedContext.request_id !== directive.request_id) return reject(directive, 'caller_context_mismatch');

  const policy = findActionPolicy(actionPolicies, payload.action_policy_id, payload.action_policy_version);
  if (!policy) {
    return reject(directive, 'unknown_policy', {
      policy_id: payload.action_policy_id, policy_version: payload.action_policy_version,
    });
  }
  if (payload.shard_id !== policy.shard_id || payload.action !== policy.action) {
    return reject(directive, 'policy_mismatch', { policy_id: policy.policy_id, policy_version: policy.version });
  }

  const invalidFields = invalidInputFields(payload.inputs ?? {}, policy);
  if (invalidFields.length) return reject(directive, 'invalid_inputs', { invalid_fields: invalidFields });

  const missingScopes = policy.required_scopes.filter((s) => !trustedContext.granted_scopes.includes(s)).sort();
  if (missingScopes.length) return reject(directive, 'missing_trusted_scope', { missing_scopes: missingScopes });

  const level = (l) => AUTHORITY_LEVELS.indexOf(l);
  if (level(trustedContext.maximum_authority) < level(policy.maximum_authority)) {
    return reject(directive, 'insufficient_authority');
  }
  if (!registeredShards.includes(policy.shard_id)) {
    return reject(directive, 'unknown_shard', { policy_id: policy.policy_id, policy_version: policy.version });
  }

  return {
    kind: 'ticket',
    ticket: {
      schema_version: '2.0',
      ticket_id: ticketId,
      request_id: directive.request_id,
      directive_id: directive.directive_id,
      action_policy_id: policy.policy_id,
      action_policy_version: policy.version,
      shard_id: policy.shard_id,
      action: policy.action,
      inputs: { ...payload.inputs },
      // exactly the policy-required subset — never the caller's full grant list
      allowed_scopes: [...policy.required_scopes],
      maximum_authority: policy.maximum_authority,
      timeout_seconds: policy.timeout_seconds,
      acceptance_tests: [...policy.acceptance_tests],
    },
  };
}
