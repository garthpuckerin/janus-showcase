/* Pure step-to-screen routing for the phone Advisor wizard. The desktop
   Advisor shows all five numbered steps on one page (`advisorSteps.js`'s
   `deriveStepStatuses`); the wizard shows exactly one at a time, so it needs
   one more small derivation on top of that: which step is "current" given
   what the walk has reached so far and which step the wizard was asked to
   show. `requestedStep` is always clamped to what the walk has actually
   produced — the UI can never navigate past a step the walk itself has not
   reached yet, only back into it. Never mutates `stepStatuses`. */
import { STEP, STEP_STATUS } from '../../advisor/advisorSteps.js';

const TOTAL_STEPS = Object.keys(STEP).length;

export const PRIMARY_ACTION = Object.freeze({
  EVALUATE: 'Evaluate',
  CONTINUE: 'Continue',
  SEND_CLARIFICATION: 'Send clarification',
  START_OVER: 'Start over',
});

function furthestReached(stepStatuses) {
  let furthest = STEP.ASK;
  for (const step of Object.values(STEP)) {
    if (stepStatuses[step] === STEP_STATUS.REACHED) furthest = Math.max(furthest, step);
  }
  return furthest;
}

function primaryActionFor(step, stepStatuses) {
  if (step === STEP.ASK) return PRIMARY_ACTION.EVALUATE;
  if (step === STEP.ASK_RESULT) {
    return stepStatuses[STEP.CONTINUATION] === STEP_STATUS.REACHED
      ? PRIMARY_ACTION.CONTINUE
      : PRIMARY_ACTION.START_OVER;
  }
  if (step === STEP.CONTINUATION) return PRIMARY_ACTION.CONTINUE;
  if (step === STEP.CLARIFY) return PRIMARY_ACTION.SEND_CLARIFICATION;
  return PRIMARY_ACTION.START_OVER; // STEP.CLARIFY_RESULT
}

/**
 * @param {{stepStatuses: object, requestedStep?: number}} input
 * @returns {{current: number, total: number, reached: number[], notNeeded: number[], primaryAction: string, canGoBack: boolean}}
 */
export function wizardModel({ stepStatuses, requestedStep = STEP.ASK }) {
  const furthest = furthestReached(stepStatuses);
  const current = Math.min(Math.max(requestedStep, STEP.ASK), furthest);

  const reached = Object.values(STEP)
    .filter((step) => stepStatuses[step] === STEP_STATUS.REACHED)
    .sort((a, b) => a - b);
  const notNeeded = Object.values(STEP)
    .filter((step) => stepStatuses[step] === STEP_STATUS.NOT_NEEDED)
    .sort((a, b) => a - b);

  return Object.freeze({
    current,
    total: TOTAL_STEPS,
    reached: Object.freeze(reached),
    notNeeded: Object.freeze(notNeeded),
    primaryAction: primaryActionFor(current, stepStatuses),
    canGoBack: current > STEP.ASK,
  });
}
