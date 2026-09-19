import { policyRefLabel } from '../../utils/format.js';

function ListField({ label, items }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{items.length ? items.join(', ') : <span className="not-applicable">(none)</span>}</dd>
    </>
  );
}

/** One persona or action policy record, rendered as a reviewable artifact.
 *  Every value shown is read off the record itself — nothing here resolves
 *  a directive or asserts anything the record doesn't already say. */
export function PolicyRecordCard({ policy, kind }) {
  return (
    <div className="panel policy-card">
      <h3>{policyRefLabel(policy.policy_id, policy.version)}</h3>
      <dl>
        {kind === 'persona' ? (
          <>
            <dt>Persona type</dt>
            <dd>{policy.persona_type}</dd>
            <ListField label="Allowed event types" items={policy.allowed_event_types} />
            <dt>Action routes</dt>
            <dd>
              {policy.action_routes.length ? (
                <ul className="policy-card__routes">
                  {policy.action_routes.map((route) => (
                    <li key={route.event_type}>
                      {route.event_type} → {route.action_policy_ref}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="not-applicable">(none — actionless)</span>
              )}
            </dd>
            <ListField label="Allowed directive types" items={policy.allowed_directive_types} />
            <ListField label="Input allowlist" items={policy.input_allowlist} />
            <ListField label="Required identity fields" items={policy.required_identity_fields} />
            <ListField label="Required context fields" items={policy.required_context_fields} />
            <dt>Model participation</dt>
            <dd>{policy.model_participation}</dd>
            <dt>Minimum model confidence</dt>
            <dd>{policy.minimum_model_confidence}</dd>
          </>
        ) : (
          <>
            <dt>Shard</dt>
            <dd>{policy.shard_id}</dd>
            <dt>Action</dt>
            <dd>{policy.action}</dd>
            <ListField label="Input allowlist" items={policy.input_allowlist} />
            <ListField label="Required inputs" items={policy.required_inputs} />
            <ListField label="Required scopes" items={policy.required_scopes} />
            <ListField label="Forbidden scopes" items={policy.forbidden_scopes} />
            <dt>Maximum authority</dt>
            <dd>{policy.maximum_authority}</dd>
            <dt>Timeout</dt>
            <dd>{policy.timeout_seconds}s</dd>
            <dt>Acceptance tests</dt>
            <dd>
              <ul className="policy-card__acceptance">
                {policy.acceptance_tests.map((testName) => (
                  <li key={testName}>{testName}</li>
                ))}
              </ul>
            </dd>
          </>
        )}
      </dl>
    </div>
  );
}
