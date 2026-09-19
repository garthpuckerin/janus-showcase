import { JANUS_OWNS, JANUS_REFUSES, FABRIC_OWNS, COMPOSED_RUNTIME_STEPS } from '../data/ownership.js';
import { ArchitectureFigureSlot } from '../components/boundary/ArchitectureFigureSlot.jsx';

function OwnershipColumn({ title, items }) {
  return (
    <div className="panel boundary-column">
      <h2 className="rail-stage__heading">{title}</h2>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function BoundaryView() {
  return (
    <section aria-labelledby="boundary-heading">
      <div className="page-header">
        <div>
          <h1 id="boundary-heading">Boundary</h1>
          <p className="page-framing">Janus decides. Fabric acts. Neither one does the other's job.</p>
        </div>
      </div>

      <div className="boundary-columns">
        <OwnershipColumn title="Janus owns" items={JANUS_OWNS} />
        <OwnershipColumn title="Janus refuses to own" items={JANUS_REFUSES} />
        <OwnershipColumn title="Fabric owns" items={FABRIC_OWNS} />
      </div>

      <div className="panel">
        <h2 className="rail-stage__heading">Composed runtime</h2>
        <ol className="boundary-runtime-steps">
          {COMPOSED_RUNTIME_STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>

      <ArchitectureFigureSlot />
    </section>
  );
}
