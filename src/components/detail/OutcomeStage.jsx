import { CheckCircle2 } from 'lucide-react';

export function OutcomeStage({ outcome }) {
  if (!outcome) {
    return (
      <div className="rail-stage rail-stage--not-reached">
        <h2 className="rail-stage__heading">Outcome</h2>
        <div className="panel">
          <p>Not reached — no ticket was derived.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rail-stage">
      <h2 className="rail-stage__heading">Outcome</h2>
      <div className="panel">
        <p>
          <span className="directive-chip directive-chip--activate-shard">{outcome.status}</span>
        </p>
        <dl>
          <dt>Outcome id</dt>
          <dd>{outcome.outcome_id}</dd>
        </dl>
        <h4>Acceptance</h4>
        <ul className="trace-list">
          {outcome.acceptance.map((item) => (
            <li key={item.test} className="trace-item trace-item--pass">
              <CheckCircle2 size={16} className="trace-item__icon" aria-hidden="true" />
              <span>{item.test}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
