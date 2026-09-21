import { Payload } from '../../common/Payload.jsx';

/** Stage 04's body: the plain note that a directive carries nothing Fabric
 *  needs to derive on its own, and DirectiveV2 itself behind a disclosure. */
export function DirectiveBody({ directive }) {
  return (
    <div className="story-fields">
      <p className="page-framing">
        This directive carries no ticket, scope, authority or timeout — Janus decides; Fabric derives all of those,
        if it derives anything at all.
      </p>
      <details className="story-nested">
        <summary>Show DirectiveV2</summary>
        <Payload caption="DirectiveV2" value={directive} />
      </details>
    </div>
  );
}
