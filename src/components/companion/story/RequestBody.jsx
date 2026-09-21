import { Payload } from '../../common/Payload.jsx';
import { policyRefLabel } from '../../../utils/format.js';

/** Stage 01's body: persona, policy, event and tenant as stacked label/value
 *  rows, with the event payload tucked behind its own disclosure. */
export function RequestBody({ request }) {
  return (
    <div className="story-fields">
      <div className="story-field">
        <span className="story-field__label">Persona</span>
        <span className="story-field__value mono">
          {request.persona.type} · {request.persona.id}
        </span>
      </div>
      <div className="story-field">
        <span className="story-field__label">Policy</span>
        <span className="story-field__value mono">
          {policyRefLabel(request.persona.policy_id, request.persona.policy_version)}
        </span>
      </div>
      <div className="story-field">
        <span className="story-field__label">Event</span>
        <span className="story-field__value mono">{request.event.type}</span>
      </div>
      <div className="story-field">
        <span className="story-field__label">Tenant</span>
        <span className="story-field__value mono">{request.persona.context?.tenant_id ?? '—'}</span>
      </div>
      <details className="story-nested">
        <summary>Show the event payload</summary>
        <Payload caption="Event payload" value={request.event.payload} />
      </details>
    </div>
  );
}
