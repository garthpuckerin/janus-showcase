/* The four-beat orientation (ISSUE-003, docs/DESIGN-SYSTEM.md "Entry: landing
   and orientation"). Every beat's copy and figure is derived from the real
   domain vocabulary or the anchor ledger entry (`LEDGER[0]`) — nothing here
   is a hand-typed id, count or confidence. Shared by the desktop dialog and
   the phone's one-step-per-screen view, so the two surfaces can only ever
   differ in chrome, never in what they claim. */
import { DIRECTIVES } from '../../domain/matrix.js';
import { LEDGER } from '../../data/ledger.js';
import { CALLERS } from '../../data/callers.js';

const ANCHOR = LEDGER[0];

export const BEAT = Object.freeze({ REQUEST: 1, DIRECTIVE: 2, BOUNDARY: 3, TICKET: 4 });

/** @returns {Array<{step: number, title: string, body: string, figure: object}>} */
export function buildBeats() {
  const { request } = ANCHOR.scenario;
  const ticket = ANCHOR.fabric?.kind === 'ticket' ? ANCHOR.fabric.ticket : null;

  return [
    {
      step: BEAT.REQUEST,
      title: 'One request in',
      body:
        `Every decision starts as one request: a persona policy and an event. ` +
        `This one carries ${request.persona.policy_id} for a ${request.event.type} event.`,
      figure: { kind: 'request', policyId: request.persona.policy_id, eventType: request.event.type },
    },
    {
      step: BEAT.DIRECTIVE,
      title: 'Exactly one directive out',
      body:
        'The outcome matrix resolves every request to exactly one of these directives. A model may ' +
        'offer one bounded candidate; it never selects which directive fires.',
      figure: { kind: 'directives', types: Object.values(DIRECTIVES) },
    },
    {
      step: BEAT.BOUNDARY,
      title: 'The boundary',
      body:
        'Janus decides; a separate runtime, Fabric, acts. Janus never executes a directive and stores ' +
        'nothing — the seam marks exactly where deciding ends and acting begins.',
      figure: { kind: 'seam' },
    },
    {
      step: BEAT.TICKET,
      title: 'The ticket',
      body: ticket
        ? "When Fabric issues a ticket, its granted scopes equal the action policy's required scopes " +
          "exactly — never the caller's full grant."
        : "When Fabric issues a ticket, its granted scopes equal the action policy's required scopes " +
          'exactly — never the full grant. This outcome never reached a ticket.',
      // Both lists are read off the anchor entry: what its trusted caller holds,
      // and what the ticket Fabric derived for it actually carries.
      figure: {
        kind: 'scopes',
        callerId: ANCHOR.scenario.callerId,
        granted: CALLERS[ANCHOR.scenario.callerId]?.granted_scopes ?? [],
        scopes: ticket ? ticket.allowed_scopes : [],
      },
    },
  ];
}

const BEATS = buildBeats();

/** Total beat count, read off the array itself rather than typed a second time. */
export const TOTAL_BEATS = BEATS.length;

export { BEATS };
