/* The "why this persona cannot act" facts, derived straight off a persona
   policy record. The desktop panel (`src/components/advisor/WhyCannotActPanel.jsx`)
   computes the same facts inline; this is that derivation pulled into a pure
   module so the phone wizard's Ask step can render it without a second,
   independently-drifting copy. Never mutates `policy`. */

/**
 * @param {object} policy a persona policy record (`src/domain/policies.js`)
 * @returns {{actionRouteCount: number, canActivateShard: boolean, modelParticipation: string, minimumModelConfidence: number, allowedEventTypes: string[]}}
 */
export function whyCannotAct(policy) {
  return Object.freeze({
    actionRouteCount: policy.action_routes.length,
    canActivateShard: policy.allowed_directive_types.includes('ACTIVATE_SHARD'),
    modelParticipation: policy.model_participation,
    minimumModelConfidence: policy.minimum_model_confidence,
    allowedEventTypes: Object.freeze([...policy.allowed_event_types]),
  });
}
