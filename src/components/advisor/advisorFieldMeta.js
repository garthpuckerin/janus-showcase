/* Rendering metadata for the advisor persona's own input fields. The set of
   fields a form actually shows always comes from the policy record's
   `input_allowlist` — this map only supplies *how* to render a field the
   policy already allows, never a second, independent list of allowed names.
   A field the allowlist carries but this map doesn't know about still
   renders, as a plain text input, so nothing the policy allows is ever
   silently dropped. */

export const ADVISOR_FIELD_META = Object.freeze({
  prompt: {
    label: 'Prompt',
    control: 'textarea',
    required: true,
    stage: 'ask',
    helpText: 'The question put to the advisor persona.',
  },
  objective: {
    label: 'Objective',
    control: 'text',
    required: false,
    stage: 'ask',
    helpText: 'Optional — what a good answer should optimise for.',
  },
  risk_tolerance: {
    label: 'Risk tolerance',
    control: 'select',
    required: false,
    stage: 'ask',
    options: [
      { value: '', label: 'Not provided' },
      { value: 'low', label: 'Low' },
      { value: 'moderate', label: 'Moderate' },
      { value: 'high', label: 'High' },
    ],
  },
  time_horizon_days: {
    label: 'Time horizon (days)',
    control: 'number',
    required: false,
    stage: 'ask',
  },
  constraints: {
    label: 'Constraints',
    control: 'text',
    required: false,
    stage: 'clarify',
  },
  clarification: {
    label: 'Clarification',
    control: 'text',
    required: false,
    stage: 'clarify',
  },
});

/** Metadata for a field the map above does not know about — the allowlist is
 *  still the source of truth, so an unrecognised allowlisted field renders as
 *  a plain, labelled text input rather than being hidden. */
export function fieldMeta(field) {
  return ADVISOR_FIELD_META[field] ?? { label: field, control: 'text', required: false, stage: 'clarify' };
}
