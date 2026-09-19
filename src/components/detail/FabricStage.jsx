import { CALLERS } from '../../data/callers.js';
import { ACTION_POLICIES, findActionPolicy } from '../../domain/policies.js';

/** Trusted caller + ticket (or rejection). Only ACTIVATE_SHARD ever reaches
 *  here — every other directive renders the boundary note instead. */
export function FabricStage({ directive, fabric, callerId }) {
  if (directive.type !== 'ACTIVATE_SHARD') {
    return (
      <div className="rail-stage rail-stage--not-reached">
        <h2 className="rail-stage__heading">Trusted caller &amp; ticket</h2>
        <div className="panel">
          <p>Nothing crosses the boundary — only ACTIVATE_SHARD reaches Fabric.</p>
        </div>
      </div>
    );
  }

  const caller = CALLERS[callerId];
  const ticket = fabric?.kind === 'ticket' ? fabric.ticket : null;
  const rejection = fabric?.kind === 'rejection' ? fabric.rejection : null;
  const allowedScopes = ticket?.allowed_scopes ?? [];
  const grantedScopes = caller?.granted_scopes ?? [];

  // The authority the policy requires is known even on rejection — the
  // directive's own payload names the action policy, whether or not a
  // ticket was ever derived from it. "—" is reserved for the case where
  // that policy itself cannot be resolved at all.
  const referencedPolicy = findActionPolicy(
    ACTION_POLICIES,
    directive.payload?.action_policy_id,
    directive.payload?.action_policy_version,
  );
  const authorityRequired = referencedPolicy?.maximum_authority ?? '—';

  return (
    <div className="rail-stage">
      <h2 className="rail-stage__heading">Trusted caller &amp; ticket</h2>
      <div className="panel">
        <p>
          <strong>{caller?.caller_id ?? callerId}</strong>
        </p>
        <div className="scope-columns">
          <div>
            <h4>Granted to caller</h4>
            <ul className="scope-list">
              {grantedScopes.map((scope) => {
                const onTicket = allowedScopes.includes(scope);
                return (
                  <li key={scope} className={onTicket ? '' : 'scope-list__item--absent'}>
                    {scope}
                    {!onTicket && <span className="visually-hidden"> — not copied to the ticket</span>}
                  </li>
                );
              })}
            </ul>
          </div>
          <div>
            <h4>On the ticket</h4>
            {ticket ? (
              <ul className="scope-list">
                {allowedScopes.map((scope) => (
                  <li key={scope}>{scope}</li>
                ))}
              </ul>
            ) : (
              <p className="not-applicable" aria-label="not applicable">
                No ticket — see the rejection below.
              </p>
            )}
          </div>
        </div>
        <p className="page-framing">
          Authority required: <strong>{authorityRequired}</strong> · Authority held:{' '}
          <strong>{caller?.maximum_authority ?? '—'}</strong>
        </p>
        {rejection && (
          <div className="error-card" role="alert">
            <h2>{rejection.code}</h2>
            <p>{rejection.message}</p>
            {rejection.details && <pre className="rejection-details">{JSON.stringify(rejection.details, null, 2)}</pre>}
          </div>
        )}
      </div>
    </div>
  );
}
