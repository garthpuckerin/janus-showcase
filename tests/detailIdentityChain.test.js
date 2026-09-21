/* Identity-chain gate: every equality mark has to be a real comparison of
   ledger values, never an assumption, and never issued ids have to say so —
   not render as a blank or a guessed dash. Built from real ledger entries. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEDGER } from '../src/data/ledger.js';
import {
  buildIdentityChain,
  LINK_MATCH,
  LINK_MISMATCH,
  LINK_NOT_ISSUED,
} from '../src/components/detail/identityChain.js';

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

function chainInputs(entry) {
  const ticket = entry.fabric?.kind === 'ticket' ? entry.fabric.ticket : null;
  const outcome = ticket ? entry.fabric.outcome : null;
  return { request: entry.scenario.request, directive: entry.evaluation.directive, ticket, outcome };
}

test('a real, self-consistent ledger entry with a ticket matches at every link', () => {
  const entry = LEDGER.find((e) => e.fabric?.kind === 'ticket');
  assert.ok(entry, 'expected at least one ledger entry with a derived ticket');

  const input = deepFreeze(chainInputs(entry));
  const { nodes, links } = buildIdentityChain(input);

  assert.equal(nodes.length, 4);
  assert.ok(nodes.every((node) => node.issued), 'every id should be issued once a ticket exists');
  assert.equal(links.length, 3);
  assert.ok(links.every((link) => link.status === LINK_MATCH), 'every link should match on an untampered entry');
});

test("tampering a copy of the ticket's request_id flips its link to a mismatch, and never touches the original", () => {
  const entry = LEDGER.find((e) => e.fabric?.kind === 'ticket');
  const input = deepFreeze(chainInputs(entry));
  const originalRequestId = input.ticket.request_id;

  const tamperedTicket = { ...input.ticket, request_id: `${originalRequestId}-tampered` };
  const { links } = buildIdentityChain({ ...input, ticket: tamperedTicket });

  assert.equal(links[1].status, LINK_MISMATCH, 'the directive_id -> ticket_id link should flip to a mismatch');
  // the frozen, original ticket is untouched — buildIdentityChain only ever read a copy
  assert.equal(input.ticket.request_id, originalRequestId);
  assert.equal(entry.fabric.ticket.request_id, originalRequestId);
});

test('ids that were never issued are reported as not issued, and their links as not-issued', () => {
  const entry = LEDGER.find((e) => e.fabric?.kind !== 'ticket');
  assert.ok(entry, 'expected at least one ledger entry with no derived ticket');

  const input = deepFreeze(chainInputs(entry));
  const { nodes, links } = buildIdentityChain(input);

  const ticketNode = nodes.find((n) => n.key === 'ticket_id');
  const outcomeNode = nodes.find((n) => n.key === 'outcome_id');
  assert.equal(ticketNode.issued, false);
  assert.equal(ticketNode.value, null);
  assert.equal(outcomeNode.issued, false);
  assert.equal(outcomeNode.value, null);
  assert.equal(links[1].status, LINK_NOT_ISSUED);
  assert.equal(links[2].status, LINK_NOT_ISSUED);
});

test('buildIdentityChain never mutates its inputs (frozen inputs do not throw)', () => {
  for (const entry of LEDGER) {
    const input = deepFreeze(chainInputs(entry));
    assert.doesNotThrow(() => buildIdentityChain(input), `${entry.scenario.id} should not mutate its inputs`);
  }
});
