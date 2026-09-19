/* The canonical v2 policy records the cockpit runs on. Persona policy owns
   event → action-policy routes; action policy fixes shard, action, inputs,
   required scopes and the authority ceiling. Records are frozen: a policy
   change is a new version, never an edit in place. */

const deepFreeze = (o) => {
  Object.values(o).forEach((v) => { if (v && typeof v === 'object') deepFreeze(v); });
  return Object.freeze(o);
};

export const PERSONA_TYPES = Object.freeze(['audience', 'advisor', 'shard', 'system']);
export const AUTHORITY_LEVELS = Object.freeze(['L0', 'L1', 'L2', 'L3']);

export const PERSONA_POLICIES = deepFreeze([
  {
    schema_version: '2.0',
    policy_id: 'audience.crm-contact-upsert',
    version: 1,
    persona_type: 'audience',
    allowed_event_types: ['lead.received'],
    action_routes: [
      { schema_version: '2.0', event_type: 'lead.received', action_policy_ref: 'lead.crm.contact-upsert@1' },
    ],
    allowed_action_policy_ids: ['lead.crm.contact-upsert@1'],
    allowed_directive_types: ['ACTIVATE_SHARD', 'ADVISE', 'REQUEST_INPUT'],
    input_allowlist: ['company', 'email', 'first_name', 'last_name', 'phone'],
    required_identity_fields: ['email'],
    required_context_fields: ['tenant_id'],
    model_participation: 'advisory',
    minimum_model_confidence: 0.0,
  },
  {
    schema_version: '2.0',
    policy_id: 'advisor.business-strategy',
    version: 1,
    persona_type: 'advisor',
    allowed_event_types: ['business.strategy.clarification.received', 'business.strategy.requested'],
    action_routes: [],
    allowed_action_policy_ids: [],
    allowed_directive_types: ['ADVISE', 'REQUEST_INPUT'],
    input_allowlist: ['clarification', 'constraints', 'objective', 'prompt', 'risk_tolerance', 'time_horizon_days'],
    required_identity_fields: [],
    required_context_fields: ['tenant_id'],
    model_participation: 'required',
    minimum_model_confidence: 0.65,
  },
]);

export const ACTION_POLICIES = deepFreeze([
  {
    schema_version: '2.0',
    policy_id: 'lead.crm.contact-upsert',
    version: 1,
    shard_id: 'lead.crm',
    action: 'crm.contact.upsert',
    input_allowlist: ['company', 'email', 'first_name', 'last_name', 'phone'],
    required_inputs: ['email'],
    required_scopes: ['crm.contact.write'],
    forbidden_scopes: ['provider.config.write', 'system.mutate'],
    maximum_authority: 'L2',
    timeout_seconds: 30,
    acceptance_tests: [
      'provider returned a stable contact identifier',
      'persisted contact email matches validated input',
    ],
  },
]);

export const policyRef = (p) => `${p.policy_id}@${p.version}`;

export function findActionPolicy(actionPolicies, policyId, version) {
  return actionPolicies.find((p) => p.policy_id === policyId && p.version === version);
}

/** Registry rules a persona policy must satisfy before the engine will load it. */
export function validatePersonaPolicy(policy, actionPolicies = ACTION_POLICIES) {
  const errors = [];
  const refs = new Set(actionPolicies.map(policyRef));
  if (!PERSONA_TYPES.includes(policy.persona_type)) errors.push(`unknown persona_type "${policy.persona_type}"`);

  const routedEvents = policy.action_routes.map((r) => r.event_type);
  if (new Set(routedEvents).size !== routedEvents.length) errors.push('an event type has more than one action route');
  for (const route of policy.action_routes) {
    if (!policy.allowed_event_types.includes(route.event_type)) errors.push(`route for "${route.event_type}" is not an allowed event`);
    if (!policy.allowed_action_policy_ids.includes(route.action_policy_ref)) errors.push(`route target "${route.action_policy_ref}" is not in the action-policy allowlist`);
    if (!refs.has(route.action_policy_ref)) errors.push(`route target "${route.action_policy_ref}" does not resolve`);
  }

  const hasUnroutedEvent = policy.allowed_event_types.some((e) => !routedEvents.includes(e));
  if (hasUnroutedEvent && policy.model_participation === 'none') {
    errors.push('an allowed event without an action route must use advisory or required model participation');
  }
  if (policy.action_routes.length === 0 && policy.allowed_directive_types.includes('ACTIVATE_SHARD')) {
    errors.push('an actionless policy cannot allow ACTIVATE_SHARD');
  }
  if (policy.action_routes.length > 0 && !policy.allowed_directive_types.includes('ACTIVATE_SHARD')) {
    errors.push('a routed policy must allow ACTIVATE_SHARD');
  }
  if (!policy.allowed_directive_types.includes('REQUEST_INPUT')) errors.push('every policy must allow REQUEST_INPUT (the fail-closed directive)');
  if (!(policy.minimum_model_confidence >= 0 && policy.minimum_model_confidence <= 1)) errors.push('minimum_model_confidence must be within 0–1');
  return errors;
}
