import { DirectiveChip } from '../common/DirectiveChip.jsx';
import { policyRefLabel, relativeTimeFromNow } from '../../utils/format.js';

/** One Attention item. Carries exactly: directive chip, scenario title, one
 *  mono line (policy ref · event type), relative time, and the ONE reason a
 *  human needs to look — read off `groupAttention()`, never typed here. The
 *  whole card is a single button that opens the decision. */
export function AttentionCard({ entry, reason, now, onOpen }) {
  const { scenario, evaluation } = entry;
  const { persona, event } = scenario.request;

  return (
    <li className="attention-card">
      <button
        type="button"
        className="attention-card__button"
        onClick={() => onOpen(scenario.id)}
      >
        <DirectiveChip type={evaluation.directive.type} />
        <span className="attention-card__title">{scenario.title}</span>
        <span className="attention-card__meta mono">
          {policyRefLabel(persona.policy_id, persona.policy_version)}
          <span aria-hidden="true"> · </span>
          {event.type}
        </span>
        <span className="attention-card__time">{relativeTimeFromNow(scenario.occurredAt, now)}</span>
        <span className="attention-card__reason">{reason}</span>
      </button>
    </li>
  );
}
