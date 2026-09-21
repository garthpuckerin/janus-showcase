/* Pure derivations for the phone decision story (docs/DESIGN-SYSTEM.md "the
   decision story"): which stage explains the outcome, and the one-line
   verdict a human reads before ever opening a stage. Both run over the same
   `{evaluation, fabric}` shape `stageStates()` takes — never a second,
   competing read of the ledger. Pure: neither argument is ever mutated,
   nothing here is stored. */

const text = (value) => ({ type: 'text', value });
const code = (value) => ({ type: 'code', value });

/**
 * The one stage that explains why the decision landed where it did: the
 * failed pre-matrix check, else the Fabric rejection, else the directive
 * itself (an activation, an ask for input, or advice) — the fixed order the
 * design contract gives.
 * @param {{evaluation: {trace: Array}, fabric: object|null}} input
 * @returns {'pre-matrix'|'fabric'|'directive'} a `stageStates()` key
 */
export function explainingStage({ evaluation, fabric }) {
  if (evaluation.trace.some((step) => !step.ok)) return 'pre-matrix';
  // Whenever a directive crossed the boundary, Fabric's stage is the story:
  // a rejection explains why nothing ran, and a ticket shows the product's
  // signature — what the caller was granted versus what the ticket carries.
  // (Opening the Directive stage for a ticket pushed the seam to the bottom
  // edge of the first screen and the Fabric panel off it.)
  if (fabric) return 'fabric';
  return 'directive';
}

/**
 * The one-line verdict, as segments a caller joins to render: `code`
 * segments carry a verbatim protocol identifier and render in mono, `text`
 * segments are prose. Never a hand-typed figure — every identifier here is
 * read off `evaluation`/`fabric` itself.
 * @param {{evaluation: {directive: object, trace: Array}, fabric: object|null}} input
 * @returns {Array<{type: 'text'|'code', value: string}>}
 */
export function storyVerdict({ evaluation, fabric }) {
  const { directive, trace } = evaluation;
  const failedStep = trace.find((step) => !step.ok);
  if (failedStep) {
    return [text('Failed closed at '), code(failedStep.check), text(' — the model was not called')];
  }

  /* Deciding is not acting — the whole product is that distinction, so the
     verdict never says "activated" for a directive. Janus DIRECTS an
     activation; only Fabric's outcome says whether anything ran. */
  if (directive.type === 'ACTIVATE_SHARD') {
    const shard = code(directive.payload.shard_id);
    if (fabric?.kind === 'rejection') {
      return [
        text('Janus directed '), shard, text(' to activate; Fabric rejected the caller: '),
        code(fabric.rejection.code), text(' — nothing ran'),
      ];
    }
    if (fabric?.kind === 'ticket') {
      return [
        text('Janus directed '), shard,
        text(` to activate; Fabric issued a ticket — outcome ${fabric.outcome.status}`),
      ];
    }
    // Not reachable against the real ledger (a fabric result always exists
    // beside ACTIVATE_SHARD — see tests/ledger.test.js) but never silent.
    return [text('Janus directed '), shard, text(' to activate')];
  }

  if (directive.type === 'REQUEST_INPUT') {
    const fields = directive.payload.requested_fields ?? [];
    // Read off the evaluation itself: a continuation exists or it does not.
    const held = Boolean(evaluation.continuation);
    const tail = held ? '; a continuation is held by the caller' : '; no continuation was minted';
    if (fields.length === 0) return [text(`Asked for input${tail}`)];
    return [text('Asked for '), code(fields.join(', ')), text(tail)];
  }

  return [text('Advised; nothing crosses the boundary')];
}
