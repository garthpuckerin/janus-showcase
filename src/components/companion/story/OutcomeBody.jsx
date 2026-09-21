import { CheckCircle2 } from 'lucide-react';
import { Payload } from '../../common/Payload.jsx';

/** Stage 06's body, on Fabric's dark region: status, outcome id, acceptance
 *  tests, and the ticket document behind its own disclosure. Only rendered
 *  when the outcome stage is reached — the not-reached case is handled by
 *  `StoryStage`'s plain row, never by this component. */
export function OutcomeBody({ fabric }) {
  const ticket = fabric?.kind === 'ticket' ? fabric.ticket : null;
  const outcome = ticket ? fabric.outcome : null;
  if (!outcome) return null;

  return (
    <div className="fabric-face">
      <p>
        <span className="chip chip--positive">{outcome.status}</span>
      </p>
      <p className="story-line">
        Outcome id: <code>{outcome.outcome_id}</code>
      </p>
      <h4>Acceptance</h4>
      <ul className="trace-list">
        {outcome.acceptance.map((item) => (
          <li key={item.test} className="trace-item trace-item--pass">
            <CheckCircle2 size={16} className="trace-item__icon" aria-hidden="true" />
            <span>{item.test}</span>
          </li>
        ))}
      </ul>
      <details className="story-nested">
        <summary>Show TicketV2</summary>
        <Payload caption="TicketV2" value={ticket} />
      </details>
    </div>
  );
}
