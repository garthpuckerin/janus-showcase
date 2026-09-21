import { CALLERS } from '../../data/callers.js';
import { ACTION_POLICIES, findActionPolicy } from '../../domain/policies.js';
import { Payload } from '../common/Payload.jsx';

/** Trusted caller vs the derived ticket (or the rejection that stopped one
 *  from existing). Only ever rendered once the directive has already been
 *  established as ACTIVATE_SHARD — see FabricFace. */
export function TrustedCallerCard({ directive, fabric, callerId }) {
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
    <div className="card fabric-face__card" aria-labelledby="fabric-caller-heading">
      <div className="card__header">
        <span className="eyebrow" id="fabric-caller-heading">
          Trusted caller &amp; ticket
        </span>
      </div>
      <p className="fabric-face__caller">
        <code>{caller?.caller_id ?? callerId}</code>
      </p>
      <div className="scope-columns">
        <div>
          <h3 className="face-subheading">Granted to caller</h3>
          <ul className="scope-list">
            {grantedScopes.map((scope) => {
              const onTicket = allowedScopes.includes(scope);
              return (
                <li key={scope} className={onTicket ? '' : 'scope-list__item--absent'}>
                  <code>{scope}</code>
                  {!onTicket && <span className="scope-list__note">not copied to the ticket</span>}
                </li>
              );
            })}
          </ul>
        </div>
        <div>
          <h3 className="face-subheading">On the ticket</h3>
          {ticket ? (
            <ul className="scope-list">
              {allowedScopes.map((scope) => (
                <li key={scope}>
                  <code>{scope}</code>
                </li>
              ))}
            </ul>
          ) : (
            <p className="not-applicable" aria-label="not applicable">
              No ticket — see the rejection below.
            </p>
          )}
        </div>
      </div>
      <p className="fabric-face__authority">
        Authority required: <code>{authorityRequired}</code> · Authority held: <code>{caller?.maximum_authority ?? '—'}</code>
      </p>
      {rejection && (
        <div className="fabric-face__rejection" role="alert">
          <span className="chip chip--danger">{rejection.code}</span>
          <p>{rejection.message}</p>
          {rejection.details && <Payload caption="FabricRejectionV2" value={rejection.details} />}
        </div>
      )}
    </div>
  );
}
