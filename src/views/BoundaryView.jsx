import { JANUS_OWNS, JANUS_REFUSES, FABRIC_OWNS } from '../data/ownership.js';
import { OwnershipCard } from '../components/boundary/OwnershipCard.jsx';
import { CompositedRuntime } from '../components/boundary/CompositedRuntime.jsx';
import { ArchitectureFigureSlot } from '../components/boundary/ArchitectureFigureSlot.jsx';

export function BoundaryView() {
  return (
    <section aria-labelledby="boundary-heading">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Understand</span>
          <h1 id="boundary-heading" className="page-heading__title">Boundary</h1>
          <p className="page-heading__lede">Janus decides. Fabric acts. Neither one does the other&rsquo;s job.</p>
        </div>
      </div>

      <div className="boundary-columns">
        <OwnershipCard title="Janus owns" items={JANUS_OWNS} />
        <OwnershipCard title="Janus refuses to own" items={JANUS_REFUSES} />
      </div>

      <div className="seam" role="separator" aria-orientation="horizontal">
        <span>JANUS DECIDES · FABRIC ACTS</span>
      </div>

      <div className="panel-face boundary-fabric">
        <OwnershipCard title="Fabric owns" items={FABRIC_OWNS} />
      </div>

      <CompositedRuntime />

      <ArchitectureFigureSlot />
    </section>
  );
}
