import { CALLERS } from '../../../data/callers.js';
import { ACTION_POLICIES, findActionPolicy } from '../../../domain/policies.js';
import { Payload } from '../../common/Payload.jsx';

/** Stage 05's body, on Fabric's full-bleed dark region: the trusted caller
 *  against the derived ticket, or the rejection that stopped one from
 *  existing. Authority required is read off the same action-policy lookup
 *  `TrustedCallerCard.jsx` uses on the desktop (`findActionPolicy`) — there
 *  is no separate single-purpose helper exported for it, so this replicates
 *  that three-line derivation rather than importing the desktop card whole
 *  (the desktop card renders as a `.card`, which this screen must not nest
 *  inside the dark region). */
export function FabricBody({ directive, fabric, callerId }) {
  const caller = CALLERS[callerId];
  const ticket = fabric?.kind === 'ticket' ? fabric.ticket : null;
  const rejection = fabric?.kind === 'rejection' ? fabric.rejection : null;
  const allowedScopes = ticket?.allowed_scopes ?? [];
  const grantedScopes = caller?.granted_scopes ?? [];

  const referencedPolicy = findActionPolicy(
    ACTION_POLICIES,
    directive.payload?.action_policy_id,
    directive.payload?.action_policy_version,
  );
  const authorityRequired = referencedPolicy?.maximum_authority ?? '—';

  return (
    <div className="fabric-face">
      <p className="story-line">
        <code>{caller?.caller_id ?? callerId}</code>
      </p>
      <div className="scope-columns">
        <div>
          <h2 className="face-subheading">Granted to caller</h2>
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
          <h2 className="face-subheading">On the ticket</h2>
          {ticket ? (
            <ul className="scope-list">
              {allowedScopes.map((scope) => (
                <li key={scope}>
                  <code>{scope}</code>
                </li>
              ))}
            </ul>
          ) : (
            <p className="fabric-face__empty">No ticket — see the rejection below.</p>
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
          {rejection.details && (
            <details className="story-nested">
              <summary>Show FabricRejectionV2</summary>
              <Payload caption="FabricRejectionV2" value={rejection.details} />
            </details>
          )}
        </div>
      )}
    </div>
  );
}
