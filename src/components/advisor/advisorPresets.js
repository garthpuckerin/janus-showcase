/* Scripted port results for the Advisor workflow. Illustrative only — no
   model or provider adapter ships with the engine, and none runs here.
   This is a `.js` data module (exempt from the view-honesty scan): the
   confidence figures a preset carries have to live somewhere, and this is
   the one place, never typed again inside a view. */
export const ADVISOR_PORT_PRESETS = Object.freeze({
  'needs-input': {
    label: 'Needs input · asks for risk tolerance',
    value: {
      status: 'ok',
      candidate: { classification: 'needs_input', confidence: 0.8, requested_fields: ['risk_tolerance'] },
    },
  },
  'advice-above-floor': {
    label: 'Advice · confidence 0.82',
    value: {
      status: 'ok',
      candidate: {
        classification: 'not_actionable',
        confidence: 0.82,
        advice: 'Pilot a smaller service kiosk before committing to a full branch build-out.',
      },
    },
  },
  'advice-below-floor': {
    label: 'Advice · confidence 0.50 (below the policy floor)',
    value: {
      status: 'ok',
      candidate: {
        classification: 'not_actionable',
        confidence: 0.5,
        advice: 'Directional only — this candidate did not clear the policy floor.',
      },
    },
  },
  'actionable-candidate': {
    label: '"Actionable" candidate · confidence 0.99',
    value: {
      status: 'ok',
      candidate: { classification: 'actionable', confidence: 0.99 },
    },
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

/* The first ask opens on the signature path (a continuation is minted); the
   follow-up opens on accepted advice, so the walk completes in two clicks. */
export const DEFAULT_ASK_PORT_KEY = 'needs-input';
export const DEFAULT_ADVISOR_PORT_KEY = 'advice-above-floor';
