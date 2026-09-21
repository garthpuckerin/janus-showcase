import { policyRefLabel } from '../../utils/format.js';

function MonoChipList({ items }) {
  if (!items.length) return <span className="not-applicable">(none)</span>;
  return (
    <ul className="policy-card__chip-list">
      {items.map((item) => (
        <li key={item}>
          <span className="chip chip--neutral mono">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ForbiddenScopeList({ items }) {
  if (!items.length) return <span className="not-applicable">(none)</span>;
  return (
    <ul className="policy-card__chip-list">
      {items.map((item) => (
        <li key={item}>
          <span className="chip chip--danger mono">forbidden: {item}</span>
        </li>
      ))}
    </ul>
  );
}

function Row({ label, children }) {
  return (
    <div className="policy-card__row">
      <span className="policy-card__row-label">{label}</span>
      <div className="policy-card__row-value">{children}</div>
    </div>
  );
}

/** One persona or action policy record, rendered as a reviewable artifact.
 *  Every value shown is read off the record itself — nothing here resolves
 *  a directive or asserts anything the record doesn't already say. Routes,
 *  allowlists and scopes render as mono chips; forbidden scopes carry the
 *  visible word "forbidden", not colour alone. */
export function PolicyRecordCard({ policy, kind }) {
  return (
    <article className="card policy-card">
      <div className="card__header policy-card__header">
        <h3 className="policy-card__ref mono">{policyRefLabel(policy.policy_id, policy.version)}</h3>
        <span className="chip chip--info mono">{kind === 'persona' ? policy.persona_type : 'action policy'}</span>
      </div>

      {kind === 'persona' ? (
        <div className="policy-card__rows">
          <Row label="Allowed event types"><MonoChipList items={policy.allowed_event_types} /></Row>
          <Row label="Action routes">
            {policy.action_routes.length ? (
              <ul className="policy-card__routes">
                {policy.action_routes.map((route) => (
                  <li key={route.event_type} className="mono">
                    {route.event_type} → {route.action_policy_ref}
                  </li>
                ))}
              </ul>
            ) : (
              <span className="not-applicable">(none — actionless)</span>
            )}
          </Row>
          <Row label="Allowed directive types"><MonoChipList items={policy.allowed_directive_types} /></Row>
          <Row label="Input allowlist"><MonoChipList items={policy.input_allowlist} /></Row>
          <Row label="Required identity fields"><MonoChipList items={policy.required_identity_fields} /></Row>
          <Row label="Required context fields"><MonoChipList items={policy.required_context_fields} /></Row>
          <Row label="Model participation"><span className="mono">{policy.model_participation}</span></Row>
          <Row label="Minimum model confidence">
            <span className="mono tabular-num">{policy.minimum_model_confidence}</span>
          </Row>
        </div>
      ) : (
        <div className="policy-card__rows">
          <Row label="Shard"><span className="mono">{policy.shard_id}</span></Row>
          <Row label="Action"><span className="mono">{policy.action}</span></Row>
          <Row label="Input allowlist"><MonoChipList items={policy.input_allowlist} /></Row>
          <Row label="Required inputs"><MonoChipList items={policy.required_inputs} /></Row>
          <Row label="Required scopes"><MonoChipList items={policy.required_scopes} /></Row>
          <Row label="Forbidden scopes"><ForbiddenScopeList items={policy.forbidden_scopes} /></Row>
          <Row label="Maximum authority"><span className="mono">{policy.maximum_authority}</span></Row>
          <Row label="Timeout"><span className="mono tabular-num">{policy.timeout_seconds}s</span></Row>
          <Row label="Acceptance tests">
            <ul className="policy-card__acceptance">
              {policy.acceptance_tests.map((testName) => (
                <li key={testName}>{testName}</li>
              ))}
            </ul>
          </Row>
        </div>
      )}
    </article>
  );
}
