import { Payload } from '../common/Payload.jsx';

export function RequestStage({ request }) {
  return (
    <div className="rail-stage">
      <h2 className="rail-stage__heading">Request</h2>
      <div className="panel">
        <dl>
          <dt>Persona</dt>
          <dd>{request.persona.type} · {request.persona.id}</dd>
          <dt>Policy</dt>
          <dd>{request.persona.policy_id}@{request.persona.policy_version}</dd>
          <dt>Event</dt>
          <dd>{request.event.type}</dd>
          <dt>Tenant</dt>
          <dd>{request.persona.context?.tenant_id ?? '—'}</dd>
        </dl>
        <Payload caption="Event payload" value={request.event.payload} />
      </div>
    </div>
  );
}
