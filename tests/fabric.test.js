/* Scope + correlation gate for the Fabric side of the governed path. Fabric —
   not the decision engine — validates the trusted caller and derives the
   ticket; these tests pin the properties the protocol states, including what
   must NOT happen (no ticket on rejection, no scope beyond the policy's). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { REJECTION_CODES, deriveTicket } from '../src/domain/fabric.js';
import { ACTION_POLICIES } from '../src/domain/policies.js';

const policy = ACTION_POLICIES.find((p) => p.policy_id === 'lead.crm.contact-upsert');

const directive = () => ({
  schema_version: '2.0',
  directive_id: 'dir-001',
  request_id: 'req-001',
  type: 'ACTIVATE_SHARD',
  payload: {
    action_policy_id: policy.policy_id,
    action_policy_version: policy.version,
    shard_id: policy.shard_id,
    action: policy.action,
    inputs: { email: 'person@example.com', company: 'Northwind' },
  },
});

const caller = (over = {}) => ({
  schema_version: '2.0',
  request_id: 'req-001',
  caller_id: 'svc.lead-intake',
  granted_scopes: ['crm.contact.write', 'crm.contact.read', 'billing.invoice.read'],
  maximum_authority: 'L2',
  ...over,
});

const env = { actionPolicies: ACTION_POLICIES, registeredShards: ['lead.crm'], ticketId: 'tkt-001' };

test('the rejection code list is the protocol\'s closed list', () => {
  assert.deepEqual([...REJECTION_CODES].sort(), [
    'caller_context_mismatch', 'insufficient_authority', 'invalid_directive', 'invalid_inputs',
    'invalid_json', 'missing_trusted_scope', 'policy_mismatch', 'unknown_policy',
    'unknown_shard', 'unsupported_directive', 'unsupported_policy',
  ]);
});

test('a ticket carries exactly the policy-required scopes, never all caller grants', () => {
  const out = deriveTicket(directive(), caller(), env);
  assert.equal(out.kind, 'ticket');
  assert.deepEqual(out.ticket.allowed_scopes, ['crm.contact.write']);
  assert.ok(!out.ticket.allowed_scopes.includes('billing.invoice.read'));
  for (const forbidden of policy.forbidden_scopes) {
    assert.ok(!out.ticket.allowed_scopes.includes(forbidden));
  }
});

test('correlation is exact across directive and ticket', () => {
  const { ticket } = deriveTicket(directive(), caller(), env);
  assert.equal(ticket.request_id, 'req-001');
  assert.equal(ticket.directive_id, 'dir-001');
  assert.equal(ticket.ticket_id, 'tkt-001');
  assert.equal(ticket.timeout_seconds, policy.timeout_seconds);
  assert.equal(ticket.shard_id, policy.shard_id);
  assert.equal(ticket.action, policy.action);
});

test('a caller without the required scope is rejected and NO ticket exists', () => {
  const out = deriveTicket(directive(), caller({ granted_scopes: ['crm.contact.read'] }), env);
  assert.equal(out.kind, 'rejection');
  assert.equal(out.rejection.code, 'missing_trusted_scope');
  assert.deepEqual(out.rejection.details.missing_scopes, ['crm.contact.write']);
  assert.equal(out.ticket, undefined);
  assert.equal(out.rejection.ticket_id, undefined);
});

test('authority below the policy requirement is rejected', () => {
  const out = deriveTicket(directive(), caller({ maximum_authority: 'L1' }), env);
  assert.equal(out.rejection.code, 'insufficient_authority');
  assert.equal(out.ticket, undefined);
});

test('trusted context bound to another request is rejected', () => {
  const out = deriveTicket(directive(), caller({ request_id: 'req-999' }), env);
  assert.equal(out.rejection.code, 'caller_context_mismatch');
});

test('only ACTIVATE_SHARD reaches Fabric', () => {
  for (const type of ['ADVISE', 'REQUEST_INPUT']) {
    const out = deriveTicket({ ...directive(), type }, caller(), env);
    assert.equal(out.rejection.code, 'unsupported_directive');
  }
});

test('a directive cannot rename the shard or action its policy owns', () => {
  const d = directive();
  d.payload.shard_id = 'billing.ledger';
  assert.equal(deriveTicket(d, caller(), env).rejection.code, 'policy_mismatch');
});

test('unknown policy version, bad inputs and an unregistered shard each reject', () => {
  const v9 = directive(); v9.payload.action_policy_version = 9;
  assert.equal(deriveTicket(v9, caller(), env).rejection.code, 'unknown_policy');

  const extra = directive(); extra.payload.inputs.role = 'admin';
  const bad = deriveTicket(extra, caller(), env);
  assert.equal(bad.rejection.code, 'invalid_inputs');
  assert.deepEqual(bad.rejection.details.invalid_fields, ['role']);

  const noEmail = directive(); delete noEmail.payload.inputs.email;
  assert.equal(deriveTicket(noEmail, caller(), env).rejection.code, 'invalid_inputs');

  assert.equal(deriveTicket(directive(), caller(), { ...env, registeredShards: [] }).rejection.code, 'unknown_shard');
});

test('checks run in Fabric\'s order: scope is reported before authority', () => {
  const out = deriveTicket(directive(), caller({ granted_scopes: [], maximum_authority: 'L0' }), env);
  assert.equal(out.rejection.code, 'missing_trusted_scope');
});

test('inputs are never mutated', () => {
  const d = directive(); const c = caller();
  const snap = JSON.stringify([d, c]);
  deriveTicket(d, c, env);
  assert.equal(JSON.stringify([d, c]), snap);
});
