/* The stage-rail header's single source of truth. Six fixed stages — Request,
   Pre-matrix checks, Outcome matrix, Directive, Trusted caller & ticket,
   Outcome — each reduced to a state (`complete` | `failed` | `not-reached`)
   and a mono status line, both DERIVED from the real `evaluate()`/fabric
   output for this scenario. Nothing here is asserted: a pre-matrix failure
   is read off `trace`, the fired row off `diagnostics.matrix_row`, the
   rejection code and outcome status off `fabric` itself. Pure — neither
   argument is ever mutated. */

export const STAGE_COMPLETE = 'complete';
export const STAGE_FAILED = 'failed';
export const STAGE_NOT_REACHED = 'not-reached';

const NOT_REACHED_STATUS = 'not reached';

/**
 * @param {{evaluation: {directive: object, diagnostics: object, trace: Array}, fabric: object|null}} input
 * @returns {Array<{key: string, title: string, state: string, status: string}>} exactly six entries, in rail order
 */
export function stageStates({ evaluation, fabric }) {
  const { directive, diagnostics, trace } = evaluation;
  const matrixReached = diagnostics.matrix_row !== null;
  const preMatrixFailed = trace.some((step) => !step.ok);
  const passedCount = trace.filter((step) => step.ok).length;

  const request = {
    key: 'request',
    title: 'Request',
    state: STAGE_COMPLETE,
    status: 'Received',
  };

  const preMatrix = {
    key: 'pre-matrix',
    title: 'Pre-matrix checks',
    state: preMatrixFailed ? STAGE_FAILED : STAGE_COMPLETE,
    status: `${passedCount} of ${trace.length} passed`,
  };

  const matrix = {
    key: 'matrix',
    title: 'Outcome matrix',
    state: matrixReached ? STAGE_COMPLETE : STAGE_NOT_REACHED,
    status: matrixReached ? `row ${diagnostics.matrix_row}` : NOT_REACHED_STATUS,
  };

  const directiveStage = {
    key: 'directive',
    title: 'Directive',
    state: matrixReached ? STAGE_COMPLETE : STAGE_NOT_REACHED,
    status: matrixReached ? directive.type : NOT_REACHED_STATUS,
  };

  const activatesShard = matrixReached && directive.type === 'ACTIVATE_SHARD';
  const rejection = fabric?.kind === 'rejection' ? fabric.rejection : null;
  const ticket = fabric?.kind === 'ticket' ? fabric.ticket : null;

  let fabricState = STAGE_NOT_REACHED;
  let fabricStatus = NOT_REACHED_STATUS;
  if (activatesShard && rejection) {
    fabricState = STAGE_FAILED;
    fabricStatus = rejection.code;
  } else if (activatesShard && ticket) {
    fabricState = STAGE_COMPLETE;
    fabricStatus = ticket.ticket_id;
  }

  const fabricStageResult = {
    key: 'fabric',
    title: 'Trusted caller & ticket',
    state: fabricState,
    status: fabricStatus,
  };

  const outcomeReached = fabricState === STAGE_COMPLETE;
  const outcomeStage = {
    key: 'outcome',
    title: 'Outcome',
    state: outcomeReached ? STAGE_COMPLETE : STAGE_NOT_REACHED,
    status: outcomeReached ? fabric.outcome.status : NOT_REACHED_STATUS,
  };

  return [request, preMatrix, matrix, directiveStage, fabricStageResult, outcomeStage];
}
