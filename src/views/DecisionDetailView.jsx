import { useCallback, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { runScenario, findLedgerEntry } from '../data/ledger.js';
import { policyRefLabel } from '../utils/format.js';
import { RequestStage } from '../components/detail/RequestStage.jsx';
import { PreMatrixStage } from '../components/detail/PreMatrixStage.jsx';
import { MatrixStage } from '../components/detail/MatrixStage.jsx';
import { DirectiveStage } from '../components/detail/DirectiveStage.jsx';
import { FabricFace } from '../components/detail/FabricFace.jsx';
import { IdentityChain } from '../components/detail/IdentityChain.jsx';
import { StageRail } from '../components/detail/StageRail.jsx';
import { stageStates } from '../components/detail/stageStates.js';
import { RerunPanel } from '../components/detail/RerunPanel.jsx';
import { PORT_PRESETS, classifyPortKey } from '../components/detail/portPresets.js';
import { usePageReady } from '../hooks/usePageReady.js';
import { Skeleton } from '../components/common/Skeleton.jsx';
import { DataState } from '../components/common/DataState.jsx';

/** The decision-detail rail: identity chain, the six-stage rail, Janus's side
 *  (Request → Pre-matrix checks → Outcome matrix → Directive), the seam, and
 *  Fabric's side (Trusted caller & ticket → Outcome). Re-running with a
 *  different caller or model result re-derives every one of those regions
 *  from the same `runScenario()` the ledger itself was built from. */
export function DecisionDetailView({ entry, onBack }) {
  const ready = usePageReady();
  const defaultPortKey = useMemo(() => (entry ? classifyPortKey(entry.scenario.port) : 'no-port'), [entry]);
  const [override, setOverride] = useState(null);

  const continuationInput = useMemo(() => {
    if (!entry?.scenario.continuationFrom) return undefined;
    return findLedgerEntry(entry.scenario.continuationFrom)?.evaluation.continuation;
  }, [entry]);

  const active = useMemo(() => {
    if (!entry) return null;
    if (!override) return entry;
    return runScenario(entry.scenario, {
      port: PORT_PRESETS[override.portKey].value,
      callerId: override.callerId,
      continuation: continuationInput,
    });
  }, [entry, override, continuationInput]);

  const handleRun = useCallback((next) => setOverride(next), []);
  const handleReset = useCallback(() => setOverride(null), []);

  const stages = useMemo(() => (active ? stageStates(active) : []), [active]);

  if (!entry) {
    return (
      <DataState
        tone="neutral"
        title="This decision could not be found"
        action={
          <button type="button" className="button" onClick={onBack}>
            Back to decisions
          </button>
        }
      >
        The requested id does not match any entry in the ledger.
      </DataState>
    );
  }

  if (!ready) {
    return (
      <section aria-busy="true">
        <Skeleton height={32} width="40%" />
        <div style={{ marginTop: 16 }}>
          <Skeleton height={260} />
        </div>
      </section>
    );
  }

  const { evaluation, fabric } = active;
  const { directive, diagnostics, trace } = evaluation;
  const matrixReached = diagnostics.matrix_row !== null;
  const ticket = fabric?.kind === 'ticket' ? fabric.ticket : null;
  const outcome = fabric?.kind === 'ticket' ? fabric.outcome : null;
  const callerId = override?.callerId ?? entry.scenario.callerId;
  const { persona } = entry.scenario.request;

  return (
    <section aria-labelledby="decision-detail-heading" className="detail-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">{policyRefLabel(persona.policy_id, persona.policy_version)}</span>
          <h1 id="decision-detail-heading" className="page-heading__title">
            {entry.scenario.title}
          </h1>
          <p className="page-heading__lede">{entry.scenario.summary}</p>
        </div>
        <div className="page-heading__actions">
          <button type="button" className="button button--ghost" onClick={onBack}>
            <ArrowLeft size={16} aria-hidden="true" /> Back to decisions
          </button>
        </div>
      </div>

      <IdentityChain request={entry.scenario.request} directive={directive} ticket={ticket} outcome={outcome} />

      <StageRail stages={stages} />

      <div className="detail-faces">
        <div className="detail-janus-face">
          <div id="stage-request">
            <RequestStage request={entry.scenario.request} />
          </div>
          <div id="stage-pre-matrix">
            <PreMatrixStage trace={trace} />
          </div>
          <div id="stage-matrix">
            <MatrixStage matrixRow={diagnostics.matrix_row} reached={matrixReached} />
          </div>
          <div id="stage-directive">
            <DirectiveStage directive={directive} />
          </div>
        </div>

        <div className="seam" role="separator" aria-orientation="horizontal">
          Janus decides · Fabric acts
        </div>

        <FabricFace directive={directive} fabric={fabric} callerId={callerId} />
      </div>

      <RerunPanel
        defaultCallerId={entry.scenario.callerId}
        defaultPortKey={defaultPortKey}
        onRun={handleRun}
        onReset={handleReset}
      />
    </section>
  );
}
