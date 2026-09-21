import { ADVISOR_POLICY } from './advisorFlow.js';

/** A persistent explanation, derived entirely from the persona policy record
 *  — never a hand-typed count or figure. Sits in the sticky right column
 *  beside the walk. */
export function WhyCannotActPanel() {
  const canActivate = ADVISOR_POLICY.allowed_directive_types.includes('ACTIVATE_SHARD');

  return (
    <aside className="card advisor-why" aria-label="Why this persona cannot act">
      <div className="card__header">
        <span className="eyebrow">Why this persona cannot act</span>
      </div>
      <dl className="advisor-why__rows">
        <dt>Action routes</dt>
        <dd className="mono">{ADVISOR_POLICY.action_routes.length}</dd>
        <dt>ACTIVATE_SHARD in its directive allowlist</dt>
        <dd className="mono">{canActivate ? 'Yes' : 'No'}</dd>
        <dt>Model participation</dt>
        <dd className="mono">{ADVISOR_POLICY.model_participation}</dd>
        <dt>Minimum model confidence</dt>
        <dd className="mono tabular-num">{ADVISOR_POLICY.minimum_model_confidence}</dd>
        <dt>Allowed event types</dt>
        <dd>
          <ul className="advisor-why__events">
            {ADVISOR_POLICY.allowed_event_types.map((type) => (
              <li key={type} className="mono">{type}</li>
            ))}
          </ul>
        </dd>
      </dl>
      <p className="page-heading__lede">
        With zero action routes and no <code>ACTIVATE_SHARD</code> in its allowlist, this persona can only ever
        produce advice or ask for more input — there is no route for the outcome matrix to activate, at any
        confidence.
      </p>
    </aside>
  );
}
