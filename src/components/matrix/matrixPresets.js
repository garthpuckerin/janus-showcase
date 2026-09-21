/* Two presets, one per canonical persona policy — route presence,
   participation and "ADVISE allowed" are all read off the policy record for
   one of its own allowed event types, never typed by hand. */
import { PERSONA_POLICIES } from '../../domain/policies.js';

export function deriveMatrixSettingsFromPolicy(policy, eventType) {
  return {
    routePresent: policy.action_routes.some((route) => route.event_type === eventType),
    participation: policy.model_participation,
    adviseAllowed: policy.allowed_directive_types.includes('ADVISE'),
  };
}

/** True when the controls already hold exactly what this preset would set —
 *  the preset button then reads as pressed (one rule for the workstation and
 *  the phone lookup). The model result is not part of a preset. */
export function presetIsActive(preset, { routePresent, participation, adviseAllowed }) {
  return (
    preset.routePresent === routePresent &&
    preset.participation === participation &&
    preset.adviseAllowed === adviseAllowed
  );
}

export const MATRIX_PRESETS = Object.freeze(
  PERSONA_POLICIES.map((policy) => {
    const eventType = policy.allowed_event_types[0];
    return Object.freeze({
      key: policy.policy_id,
      label: `${policy.policy_id}@${policy.version}`,
      eventType,
      ...deriveMatrixSettingsFromPolicy(policy, eventType),
    });
  }),
);
