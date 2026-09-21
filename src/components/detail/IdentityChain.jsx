import { Check, X } from 'lucide-react';
import { buildIdentityChain } from './identityChain.js';

const NODE_LABELS = Object.freeze({
  request_id: 'Request id',
  directive_id: 'Directive id',
  ticket_id: 'Ticket id',
  outcome_id: 'Outcome id',
});

function LinkMark({ status }) {
  if (status === 'match') {
    return <Check size={14} className="identity-chain__mark identity-chain__mark--match" aria-label="matches" />;
  }
  if (status === 'mismatch') {
    return <X size={14} className="identity-chain__mark identity-chain__mark--mismatch" aria-label="does not match" />;
  }
  return (
    <span className="identity-chain__mark identity-chain__mark--pending" aria-label="not applicable">
      —
    </span>
  );
}

/** request_id → directive_id → ticket_id → outcome_id, with an equality mark
 *  per link computed from the actual objects (see identityChain.js). Ids
 *  that were never issued (no ticket derived, e.g.) render as "not issued"
 *  rather than a blank or an assumed dash. */
export function IdentityChain({ request, directive, ticket, outcome }) {
  const { nodes, links } = buildIdentityChain({ request, directive, ticket, outcome });

  return (
    <div className="identity-chain" aria-label="Identity chain across the boundary">
      {nodes.map((node, index) => (
        <div className="identity-chain__segment" key={node.key}>
          <div className="identity-chain__node" data-pending={node.issued ? undefined : 'true'}>
            <span className="identity-chain__label">{NODE_LABELS[node.key]}</span>
            <code className="identity-chain__value">{node.issued ? node.value : 'not issued'}</code>
          </div>
          {index < links.length && (
            <span className="identity-chain__arrow">
              <span className="identity-chain__glyph" aria-hidden="true">→</span>
              <LinkMark status={links[index].status} />
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
