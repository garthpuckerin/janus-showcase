import { buildIdentityChain } from '../detail/identityChain.js';

const LABELS = Object.freeze({
  request_id: 'Request',
  directive_id: 'Directive',
  ticket_id: 'Ticket',
  outcome_id: 'Outcome',
});

/** A compact, panel-toned rendition of the governed path's identity chain for
 *  the landing hero. Uses the same pure derivation the desktop detail page
 *  does (`buildIdentityChain`) so nothing here is hand-typed — but the shared
 *  `IdentityChain` component hardcodes light-canvas colours (it always sits
 *  on Janus's side, above the seam, in every other screen), so this is its
 *  own small rendition styled for `.panel-face` instead. */
export function LandingIdentityStrip({ request, directive, ticket, outcome }) {
  const { nodes } = buildIdentityChain({ request, directive, ticket, outcome });

  return (
    <dl className="landing-identity">
      {nodes.map((node) => (
        <div className="landing-identity__row" key={node.key}>
          <dt className="landing-identity__label">{LABELS[node.key]}</dt>
          <dd className="landing-identity__value mono">{node.issued ? node.value : 'not issued'}</dd>
        </div>
      ))}
    </dl>
  );
}
