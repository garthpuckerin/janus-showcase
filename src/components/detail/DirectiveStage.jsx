import { Payload } from '../common/Payload.jsx';

export function DirectiveStage({ directive }) {
  return (
    <div className="rail-stage">
      <h2 className="rail-stage__heading">Directive</h2>
      <div className="panel">
        <Payload caption="DirectiveV2" value={directive} />
        <p className="page-framing">
          This directive carries no ticket, scope, authority or timeout — Janus decides; Fabric derives all of
          those, if it derives anything at all.
        </p>
      </div>
    </div>
  );
}
