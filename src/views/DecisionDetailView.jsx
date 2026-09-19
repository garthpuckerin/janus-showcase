import { useCallback, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { runScenario, findLedgerEntry } from '../data/ledger.js';
import { RequestStage } from '../components/detail/RequestStage.jsx';
import { PreMatrixStage } from '../components/detail/PreMatrixStage.jsx';
import { MatrixStage } from '../components/detail/MatrixStage.jsx';
import { DirectiveStage } from '../components/detail/DirectiveStage.jsx';
import { BoundaryDivider } from '../components/detail/BoundaryDivider.jsx';
import { FabricStage } from '../components/detail/FabricStage.jsx';
import { OutcomeStage } from '../components/detail/OutcomeStage.jsx';
import { CorrelationStrip } from '../components/detail/CorrelationStrip.jsx';
import { RailConnector } from '../components/detail/RailConnector.jsx';
import { RerunPanel } from '../components/detail/RerunPanel.jsx';
import { PORT_PRESETS, classifyPortKey } from '../components/detail/portPresets.js';
import { usePageReady } from '../hooks/usePageReady.js';
import { Skeleton } from '../components/common/Skeleton.jsx';

export function DecisionDetailView({ entry, onBack }) {
  const ready = usePageReady();
  const defaultPortKey = useMemo(() => classifyPortKey(entry.scenario.port), [entry]);
  const [override, setOverride] = useState(null);

  const continuationInput = useMemo(() => {
    if (!entry.scenario.continuationFrom) return undefined;
    return findLedgerEntry(entry.scenario.continuationFrom)?.evaluation.continuation;
  }, [entry]);

  const active = useMemo(() => {
    if (!override) return entry;
    return runScenario(entry.scenario, {
      port: PORT_PRESETS[override.portKey].value,
      callerId: override.callerId,
      continuation: continuationInput,
    });
  }, [entry, override, continuationInput]);

  const handleRun = useCallback((next) => setOverride(next), []);
  const handleReset = useCallback(() => setOverride(null), []);

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

  return (
    <section aria-labelledby="decision-detail-heading">
      <div className="page-header">
        <div>
          <button type="button" className="button button--ghost" onClick={onBack}>
            <ArrowLeft size={16} aria-hidden="true" /> Back to decisions
          </button>
          <h1 id="decision-detail-heading">{entry.scenario.title}</h1>
          <p className="page-framing">{entry.scenario.summary}</p>
        </div>
      </div>

      <CorrelationStrip directive={directive} ticket={ticket} />

      <div className="decision-rail">
        <RequestStage request={entry.scenario.request} />
        <RailConnector />
        <PreMatrixStage trace={trace} />
        <RailConnector />
        <MatrixStage matrixRow={diagnostics.matrix_row} reached={matrixReached} />
        <RailConnector />
        <DirectiveStage directive={directive} />
        <BoundaryDivider />
        <FabricStage directive={directive} fabric={fabric} callerId={callerId} />
        <RailConnector />
        <OutcomeStage outcome={outcome} />
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
