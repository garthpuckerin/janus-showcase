/* One derived sentence for a wizard Result step. Reuses the hook's own
   `matrixRowExplanation()` output when it applies (the absent-route
   catch-all row) and otherwise derives a sentence from the directive's own
   shape — never a second, hand-typed explanation of what already happened. */
import { DIRECTIVES } from '../../../domain/matrix.js';

const ADVISE_SENTENCE = 'The advisor produced advice directly — there is nothing to hold or clarify.';
const CONTINUATION_SENTENCE = 'The persona is asking for more input before it can produce a directive.';
const NO_CONTINUATION_SENTENCE = 'This request asks for input, but the persona has no further field it can '
  + 'request — the walk ends here without a continuation.';
const ACTIVATE_SENTENCE = 'This request activated a shard — Fabric derives the ticket or rejection from here.';

/**
 * @param {{directiveType: string, hasContinuation: boolean, explanation: string|null}} input
 * @returns {string}
 */
export function resultSentence({ directiveType, hasContinuation, explanation }) {
  if (explanation) return explanation;
  if (directiveType === DIRECTIVES.ADVISE) return ADVISE_SENTENCE;
  if (directiveType === DIRECTIVES.REQUEST_INPUT) {
    return hasContinuation ? CONTINUATION_SENTENCE : NO_CONTINUATION_SENTENCE;
  }
  return ACTIVATE_SENTENCE;
}
