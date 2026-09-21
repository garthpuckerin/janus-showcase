/* Pure helpers deriving which of the Advisor walk's five numbered steps
   (01 Ask · 02 Result · 03 Continuation · 04 Clarify · 05 Result) are reached,
   from the walk's own outcomes — never re-derived ad hoc in the view.
   `useAdvisorWalk` is the only production caller; `tests/advisorWalk.test.js`
   pins this directly, independent of React. Nothing here mutates its
   arguments. */
import { MATRIX_ROWS } from '../../domain/matrix.js';

export const STEP = Object.freeze({
  ASK: 1,
  ASK_RESULT: 2,
  CONTINUATION: 3,
  CLARIFY: 4,
  CLARIFY_RESULT: 5,
});

export const STEP_STATUS = Object.freeze({
  REACHED: 'reached',
  NOT_REACHED: 'not-reached',
  NOT_NEEDED: 'not-needed',
});

/** The walk before anything has been asked: only step 01 is reached. Also
 *  what a reset returns the walk to. */
export const INITIAL_STEP_STATUSES = Object.freeze({
  [STEP.ASK]: STEP_STATUS.REACHED,
  [STEP.ASK_RESULT]: STEP_STATUS.NOT_REACHED,
  [STEP.CONTINUATION]: STEP_STATUS.NOT_REACHED,
  [STEP.CLARIFY]: STEP_STATUS.NOT_REACHED,
  [STEP.CLARIFY_RESULT]: STEP_STATUS.NOT_REACHED,
});

/** Which of the five steps are reached, given the walk's own outcomes.
 *  - No ask yet: only step 01.
 *  - An ask result that minted no continuation (advice, or any other
 *    terminal result): 01–02 reached, 03–05 are not needed — there is
 *    nothing for the caller to hold or clarify.
 *  - An ask result that minted a continuation: 01–04 reached; 05 reached
 *    only once a clarify result exists.
 *  Never mutates `askOutcome` or `clarifyOutcome`. */
export function deriveStepStatuses({ askOutcome, clarifyOutcome }) {
  if (!askOutcome) return INITIAL_STEP_STATUSES;

  const hasContinuation = Boolean(askOutcome.evaluation.continuation);
  if (!hasContinuation) {
    return Object.freeze({
      ...INITIAL_STEP_STATUSES,
      [STEP.ASK_RESULT]: STEP_STATUS.REACHED,
      [STEP.CONTINUATION]: STEP_STATUS.NOT_NEEDED,
      [STEP.CLARIFY]: STEP_STATUS.NOT_NEEDED,
      [STEP.CLARIFY_RESULT]: STEP_STATUS.NOT_NEEDED,
    });
  }

  return Object.freeze({
    ...INITIAL_STEP_STATUSES,
    [STEP.ASK_RESULT]: STEP_STATUS.REACHED,
    [STEP.CONTINUATION]: STEP_STATUS.REACHED,
    [STEP.CLARIFY]: STEP_STATUS.REACHED,
    [STEP.CLARIFY_RESULT]: clarifyOutcome ? STEP_STATUS.REACHED : STEP_STATUS.NOT_REACHED,
  });
}

/** Whatever `evaluate()` produced, mapped to a sentence for the special case
 *  the domain calls the catch-all row: an absent route with any accepted
 *  result other than not_actionable, which resolves the same way regardless
 *  of what the model claimed. Derived from the fired row's own shape, never
 *  a hardcoded row number. */
export function matrixRowExplanation(matrixRow) {
  const fired = MATRIX_ROWS.find((row) => row.row === matrixRow);
  if (!fired || fired.route !== 'absent' || fired.modelResult !== 'other') return null;
  return 'No action route exists for this event, so there is no matrix row this candidate can activate — an ' +
    'absent route with any accepted result other than not_actionable resolves to this one fixed REQUEST_INPUT.';
}
