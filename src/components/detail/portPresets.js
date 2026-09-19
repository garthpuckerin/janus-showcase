/* Scripted port results the "re-run with…" panel can pick from. Illustrative
   only — no model or provider adapter runs in this cockpit. */
export const PORT_PRESETS = Object.freeze({
  'accepted-actionable': {
    label: 'Accepted · actionable',
    value: { status: 'ok', candidate: { classification: 'actionable', confidence: 0.9 } },
  },
  'accepted-not_actionable': {
    label: 'Accepted · not_actionable',
    value: {
      status: 'ok',
      candidate: { classification: 'not_actionable', confidence: 0.9, advice: 'Illustrative advice for this re-run.' },
    },
  },
  'accepted-needs_input': {
    label: 'Accepted · needs_input',
    value: { status: 'ok', candidate: { classification: 'needs_input', confidence: 0.8, requested_fields: ['risk_tolerance'] } },
  },
  timeout: {
    label: 'Timeout',
    value: { status: 'timeout' },
  },
  'no-port': {
    label: 'No port',
    value: null,
  },
});

export function classifyPortKey(port) {
  if (!port) return 'no-port';
  if (port.status === 'timeout') return 'timeout';
  const classification = port.candidate?.classification;
  if (classification === 'actionable') return 'accepted-actionable';
  if (classification === 'not_actionable') return 'accepted-not_actionable';
  if (classification === 'needs_input') return 'accepted-needs_input';
  return 'no-port';
}
