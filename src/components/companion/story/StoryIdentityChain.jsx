import { Check, X } from 'lucide-react';
import { buildIdentityChain } from '../../detail/identityChain.js';

const NODE_LABELS = Object.freeze({
  request_id: 'Request id',
  directive_id: 'Directive id',
  ticket_id: 'Ticket id',
  outcome_id: 'Outcome id',
});

function ChainMark({ status }) {
  if (status === 'match') return <Check size={14} aria-label="matches" />;
  if (status === 'mismatch') return <X size={14} aria-label="does not match" />;
  return <span aria-label="not applicable">—</span>;
}

/** The identity chain as a vertical list — the phone's own layout, never the
 *  desktop's horizontal one — sitting in Fabric's dark-region footer.
 *  `buildIdentityChain` is the exact pure derivation the desktop chain uses;
 *  nothing about the equality marks is recomputed here. */
export function StoryIdentityChain({ request, directive, ticket, outcome }) {
  const { nodes, links } = buildIdentityChain({ request, directive, ticket, outcome });

  return (
    <dl className="story-chain" aria-label="Identity chain across the boundary">
      {nodes.map((node, index) => (
        <div className="story-chain__node" key={node.key}>
          <dt className="story-chain__label">{NODE_LABELS[node.key]}</dt>
          <dd className="story-chain__value">
            <code>{node.issued ? node.value : 'not issued'}</code>
            {index < links.length && (
              <span className={`story-chain__mark story-chain__mark--${links[index].status}`}>
                <ChainMark status={links[index].status} />
              </span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
