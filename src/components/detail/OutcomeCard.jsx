import { CheckCircle2 } from 'lucide-react';
import { Payload } from '../common/Payload.jsx';

/** The ticket's outcome: acceptance tests, and the ticket document itself
 *  tucked behind a disclosure so the caller/ticket comparison stays the
 *  hero of this side of the boundary. */
export function OutcomeCard({ fabric }) {
  const ticket = fabric?.kind === 'ticket' ? fabric.ticket : null;
  const outcome = ticket ? fabric.outcome : null;

  if (!outcome) {
    return (
      <div className="card fabric-face__card" aria-labelledby="fabric-outcome-heading">
        <div className="card__header">
          <span className="eyebrow" id="fabric-outcome-heading">
            Outcome
          </span>
        </div>
        <p className="not-applicable" aria-label="not applicable">
          Not reached — no ticket was derived.
        </p>
      </div>
    );
  }

  return (
    <div className="card fabric-face__card" aria-labelledby="fabric-outcome-heading">
      <div className="card__header">
        <span className="eyebrow" id="fabric-outcome-heading">
          Outcome
        </span>
      </div>
      <p>
        <span className="chip chip--positive">{outcome.status}</span>
      </p>
      <dl className="fabric-face__dl">
        <dt>Outcome id</dt>
        <dd>
          <code>{outcome.outcome_id}</code>
        </dd>
      </dl>
      <h3 className="face-subheading">Acceptance</h3>
      <ul className="trace-list">
        {outcome.acceptance.map((item) => (
          <li key={item.test} className="trace-item trace-item--pass">
            <CheckCircle2 size={16} className="trace-item__icon" aria-hidden="true" />
            <span>{item.test}</span>
          </li>
        ))}
      </ul>
      <details className="fabric-face__ticket-details">
        <summary>Show the ticket document</summary>
        <Payload caption="TicketV2" value={ticket} />
      </details>
    </div>
  );
}
