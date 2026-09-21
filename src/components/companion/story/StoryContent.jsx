import { useMemo } from 'react';
import { stageStates } from '../../detail/stageStates.js';
import { storyVerdict, explainingStage } from './storyModel.js';
import { StoryVerdictLine } from './StoryVerdictLine.jsx';
import { StoryStage } from './StoryStage.jsx';
import { RequestBody } from './RequestBody.jsx';
import { PreMatrixBody } from './PreMatrixBody.jsx';
import { MatrixBody } from './MatrixBody.jsx';
import { DirectiveBody } from './DirectiveBody.jsx';
import { FabricBody } from './FabricBody.jsx';
import { OutcomeBody } from './OutcomeBody.jsx';
import { StoryIdentityChain } from './StoryIdentityChain.jsx';
import { StoryDeskLink } from './StoryDeskLink.jsx';

/** The story itself, once a ledger entry is known to exist: the verdict, the
 *  six-stage stepper split across the two faces (01–04 on the canvas, 05–06
 *  full-bleed on Fabric's dark region, joined by the seam), the identity
 *  chain in the dark region's footer, and the no-re-run line. Kept separate
 *  from `DecisionStoryView` so the not-found/error paths there never import
 *  this much of the domain vocabulary. */
export function StoryContent({ entry }) {
  const { scenario, evaluation, fabric } = entry;
  const { directive, diagnostics, trace } = evaluation;
  const matrixReached = diagnostics.matrix_row !== null;
  const ticket = fabric?.kind === 'ticket' ? fabric.ticket : null;
  const outcome = fabric?.kind === 'ticket' ? fabric.outcome : null;

  const stages = useMemo(() => stageStates({ evaluation, fabric }), [evaluation, fabric]);
  const verdict = useMemo(() => storyVerdict({ evaluation, fabric }), [evaluation, fabric]);
  const explaining = useMemo(() => explainingStage({ evaluation, fabric }), [evaluation, fabric]);

  return (
    <>
      <StoryVerdictLine segments={verdict} directiveType={directive.type} />

      <ol className="story-list">
        <StoryStage stage={stages[0]} index={0} open={explaining === stages[0].key}>
          <RequestBody request={scenario.request} />
        </StoryStage>
        <StoryStage stage={stages[1]} index={1} open={explaining === stages[1].key}>
          <PreMatrixBody trace={trace} />
        </StoryStage>
        <StoryStage stage={stages[2]} index={2} open={explaining === stages[2].key}>
          <MatrixBody matrixRow={diagnostics.matrix_row} reached={matrixReached} />
        </StoryStage>
        <StoryStage stage={stages[3]} index={3} open={explaining === stages[3].key}>
          <DirectiveBody directive={directive} />
        </StoryStage>
      </ol>

      <div className="seam story-seam" role="separator" aria-orientation="horizontal">
        Janus decides · Fabric acts
      </div>

      <div className="panel-face story-dark">
        {directive.type !== 'ACTIVATE_SHARD' && (
          <p className="fabric-face__empty">
            Nothing crosses the boundary — only <code>ACTIVATE_SHARD</code> reaches Fabric.
          </p>
        )}
        <ol className="story-list story-list--dark">
          <StoryStage stage={stages[4]} index={4} dark open={explaining === stages[4].key}>
            <FabricBody directive={directive} fabric={fabric} callerId={scenario.callerId} />
          </StoryStage>
          <StoryStage stage={stages[5]} index={5} dark open={explaining === stages[5].key}>
            <OutcomeBody fabric={fabric} />
          </StoryStage>
        </ol>
        <StoryIdentityChain request={scenario.request} directive={directive} ticket={ticket} outcome={outcome} />
      </div>

      <StoryDeskLink scenarioId={scenario.id} />
    </>
  );
}
