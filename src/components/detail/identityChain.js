/* The identity chain: request_id → directive_id → ticket_id → outcome_id.
   Every id is read off the object that actually carries it; every equality
   mark is a comparison of real values, never an assumption. A downstream
   object (ticket, outcome) is expected to carry every upstream id forward
   unchanged — that is what "the chain holds" means here, so each link
   checks all of the ids minted so far, not only the one named on the arrow.
   Pure — none of `request`, `directive`, `ticket` or `outcome` is mutated. */

export const LINK_MATCH = 'match';
export const LINK_MISMATCH = 'mismatch';
export const LINK_NOT_ISSUED = 'not-issued';

function linkStatus(fromIssued, toIssued, matches) {
  if (!fromIssued || !toIssued) return LINK_NOT_ISSUED;
  return matches ? LINK_MATCH : LINK_MISMATCH;
}

/**
 * @param {{request: object, directive: object, ticket: object|null, outcome: object|null}} input
 * @returns {{nodes: Array<{key:string, value:string|null, issued:boolean}>, links: Array<{from:string, to:string, status:string}>}}
 */
export function buildIdentityChain({ request, directive, ticket, outcome }) {
  const requestId = request?.request_id ?? null;
  const directiveId = directive?.directive_id ?? null;
  const ticketId = ticket?.ticket_id ?? null;
  const outcomeId = outcome?.outcome_id ?? null;

  const nodes = [
    { key: 'request_id', value: requestId, issued: Boolean(requestId) },
    { key: 'directive_id', value: directiveId, issued: Boolean(directiveId) },
    { key: 'ticket_id', value: ticketId, issued: Boolean(ticketId) },
    { key: 'outcome_id', value: outcomeId, issued: Boolean(outcomeId) },
  ];

  const links = [
    {
      from: 'request_id',
      to: 'directive_id',
      status: linkStatus(nodes[0].issued, nodes[1].issued, directive?.request_id === requestId),
    },
    {
      from: 'directive_id',
      to: 'ticket_id',
      status: linkStatus(
        nodes[1].issued,
        nodes[2].issued,
        ticket?.request_id === requestId && ticket?.directive_id === directiveId,
      ),
    },
    {
      from: 'ticket_id',
      to: 'outcome_id',
      status: linkStatus(
        nodes[2].issued,
        nodes[3].issued,
        outcome?.request_id === requestId &&
          outcome?.directive_id === directiveId &&
          outcome?.ticket_id === ticketId,
      ),
    },
  ];

  return { nodes, links };
}
