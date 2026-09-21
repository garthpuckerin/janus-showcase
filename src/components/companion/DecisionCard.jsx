import { DirectiveChip } from '../common/DirectiveChip.jsx';
import { policyRefLabel, relativeTimeFromNow } from '../../utils/format.js';

/** The Fabric-result line: a ticket id (mono, positive dot), a verbatim
 *  rejection code (danger chip), or a plain statement that nothing crossed
 *  the boundary. Every branch is read off `entry.fabric` itself. */
function ResultLine({ fabric }) {
  if (!fabric) {
    return <span className="decision-card__result not-applicable">Nothing crossed the boundary</span>;
  }
  if (fabric.kind === 'ticket') {
    return (
      <span className="decision-card__result">
        <span className="decision-card__dot" aria-hidden="true" />
        <code>{fabric.ticket.ticket_id}</code>
      </span>
    );
  }
  return <span className="chip chip--danger">{fabric.rejection.code}</span>;
}

/** One feed card: directive chip, title, the policy·event mono line,
 *  relative time, and the one-line Fabric result. The whole card is a
 *  single button that opens the decision story. */
export function DecisionCard({ entry, now, onOpen }) {
  const { scenario, evaluation, fabric } = entry;
  const { persona, event } = scenario.request;

  return (
    <li className="decision-card">
      <button
        type="button"
        className="decision-card__button"
        onClick={() => onOpen(scenario.id)}
      >
        <DirectiveChip type={evaluation.directive.type} />
        <span className="decision-card__title">{scenario.title}</span>
        <span className="decision-card__meta mono">
          {policyRefLabel(persona.policy_id, persona.policy_version)}
          <span aria-hidden="true"> · </span>
          {event.type}
        </span>
        <span className="decision-card__time">{relativeTimeFromNow(scenario.occurredAt, now)}</span>
        <ResultLine fabric={fabric} />
      </button>
    </li>
  );
}
