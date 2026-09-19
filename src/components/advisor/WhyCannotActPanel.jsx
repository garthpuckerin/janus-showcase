import { ADVISOR_POLICY } from './advisorFlow.js';

/** A persistent explanation, derived entirely from the persona policy record
 *  — never a hand-typed count or figure. */
export function WhyCannotActPanel() {
  const canActivate = ADVISOR_POLICY.allowed_directive_types.includes('ACTIVATE_SHARD');

  return (
    <aside className="panel advisor-why" aria-label="Why this persona cannot act">
      <h2 className="rail-stage__heading">Why this persona cannot act</h2>
      <dl>
        <dt>Action routes</dt>
        <dd>{ADVISOR_POLICY.action_routes.length}</dd>
        <dt>ACTIVATE_SHARD in its directive allowlist</dt>
        <dd>{canActivate ? 'Yes' : 'No'}</dd>
        <dt>Model participation</dt>
        <dd>{ADVISOR_POLICY.model_participation}</dd>
        <dt>Minimum model confidence</dt>
        <dd>{ADVISOR_POLICY.minimum_model_confidence}</dd>
        <dt>Allowed event types</dt>
        <dd>
          <ul className="advisor-why__events">
            {ADVISOR_POLICY.allowed_event_types.map((type) => (
              <li key={type}>{type}</li>
            ))}
          </ul>
        </dd>
      </dl>
      <p className="page-framing">
        With zero action routes and no <code>ACTIVATE_SHARD</code> in its allowlist, this persona can only ever
        produce advice or ask for more input — there is no route for the outcome matrix to activate, at any
        confidence.
      </p>
    </aside>
  );
}
