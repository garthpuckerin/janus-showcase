/* A scaffolded draft persona policy — the shape `validatePersonaPolicy()`
   expects, filled with a minimal but deliberately incomplete starting point
   so the "Validate a draft" tool has something to fail on before the user
   fixes it. Never registered; purely an editable in-memory draft. */
export function scaffoldPersonaPolicy() {
  return {
    schema_version: '2.0',
    policy_id: 'draft.persona',
    version: 1,
    persona_type: 'audience',
    allowed_event_types: ['lead.received'],
    action_routes: [],
    allowed_action_policy_ids: [],
    allowed_directive_types: ['REQUEST_INPUT'],
    input_allowlist: ['email'],
    required_identity_fields: ['email'],
    required_context_fields: ['tenant_id'],
    model_participation: 'none',
    minimum_model_confidence: 0,
  };
}
