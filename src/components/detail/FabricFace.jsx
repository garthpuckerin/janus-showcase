import { TrustedCallerCard } from './TrustedCallerCard.jsx';
import { OutcomeCard } from './OutcomeCard.jsx';

/** Fabric's side of the boundary (docs/DESIGN-SYSTEM.md "the two faces"):
 *  the panel is ALWAYS drawn, even when nothing crosses — the absence is the
 *  point. Only ACTIVATE_SHARD ever reaches the caller/ticket comparison and
 *  the outcome. */
export function FabricFace({ directive, fabric, callerId }) {
  const isActivate = directive.type === 'ACTIVATE_SHARD';

  return (
    <section className="panel-face fabric-face" id="stage-fabric" aria-label="Fabric's side of the boundary">
      {!isActivate ? (
        <p className="fabric-face__empty">
          Nothing crosses the boundary — only <code>ACTIVATE_SHARD</code> reaches Fabric.
          <span id="stage-outcome" />
        </p>
      ) : (
        <div className="fabric-face__grid">
          <TrustedCallerCard directive={directive} fabric={fabric} callerId={callerId} />
          <div id="stage-outcome">
            <OutcomeCard fabric={fabric} />
          </div>
        </div>
      )}
    </section>
  );
}
