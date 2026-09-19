/* Evaluation gate: pre-matrix checks fail closed BEFORE the model port is
   called, exactly one directive comes out, and the model can never widen
   what policy fixed. Assertions include what must NOT happen. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, classifyModel } from '../src/domain/evaluate.js';
import { PERSONA_POLICIES, ACTION_POLICIES } from '../src/domain/policies.js';

const registry = { personaPolicies: PERSONA_POLICIES, actionPolicies: ACTION_POLICIES };

const lead = (over = {}) => ({
  schema_version: '2.0',
  request_id: 'req-100',
  persona: { type: 'audience', id: 'contact-intake', policy_id: 'audience.crm-contact-upsert', policy_version: 1, context: { tenant_id: 'harbor-cu' } },
  event: { type: 'lead.received', payload: { email: 'dana@example.com', company: 'Northwind', utm_source: 'webinar' } },
  state: {},
  ...over,
});

const strategy = (payload = { prompt: 'Should we open a second branch?' }, type = 'business.strategy.requested') => ({
  schema_version: '2.0',
  request_id: 'req-200',
  persona: { type: 'advisor', id: 'strategy-desk', policy_id: 'advisor.business-strategy', policy_version: 1, context: { tenant_id: 'harbor-cu' } },
  event: { type, payload },
  state: {},
});

/* A port that records whether it was called. */
const port = (result) => {
  const calls = [];
  return { calls, call: (projection) => { calls.push(projection); return result; } };
};
const accepted = (classification, confidence = 0.9, extra = {}) => ({ status: 'ok', candidate: { classification, confidence, ...extra } });

test('a routed lead activates the shard its policy owns, with projected inputs only', () => {
  const p = port(accepted('actionable'));
  const out = evaluate(lead(), registry, { modelPort: p });
  assert.equal(out.directive.type, 'ACTIVATE_SHARD');
  assert.equal(out.directive.request_id, 'req-100');
  assert.deepEqual(out.directive.payload, {
    action_policy_id: 'lead.crm.contact-upsert', action_policy_version: 1,
    shard_id: 'lead.crm', action: 'crm.contact.upsert',
    inputs: { company: 'Northwind', email: 'dana@example.com' },
  });
  assert.equal(out.directive.payload.inputs.utm_source, undefined, 'caller extras never cross the boundary');
  assert.equal(out.diagnostics.matrix_row, 3);
  assert.equal(p.calls.length, 1, 'the model is called at most once');
});

test('no directive ever carries a fabric-owned field', () => {
  const out = evaluate(lead(), registry, { modelPort: port(accepted('actionable')) });
  const json = JSON.stringify(out.directive);
  for (const banned of ['ticket', 'scope', 'authority', 'timeout', 'acceptance', 'grant']) {
    assert.ok(!json.includes(banned), `directive must not mention ${banned}`);
  }
});

test('missing tenant context fails closed and the model is NOT called', () => {
  const p = port(accepted('actionable'));
  const req = lead(); req.persona.context = {};
  const out = evaluate(req, registry, { modelPort: p });
  assert.equal(out.directive.type, 'REQUEST_INPUT');
  assert.deepEqual(out.directive.payload.requested_fields, ['persona.context.tenant_id']);
  assert.equal(out.diagnostics.model_status, 'not_applicable');
  assert.equal(out.diagnostics.matrix_row, null);
  assert.equal(p.calls.length, 0);
  assert.equal(out.continuation, undefined, 'a non-input failure mints no continuation');
});

test('unknown policy, wrong persona type and disallowed event each fail closed pre-matrix', () => {
  const cases = [
    [() => { const r = lead(); r.persona.policy_version = 7; return r; }, 'persona.policy'],
    [() => { const r = lead(); r.persona.type = 'system'; return r; }, 'persona.type'],
    [() => { const r = lead(); r.event.type = 'lead.deleted'; return r; }, 'event.type'],
  ];
  for (const [make, field] of cases) {
    const p = port(accepted('actionable'));
    const out = evaluate(make(), registry, { modelPort: p });
    assert.equal(out.directive.type, 'REQUEST_INPUT');
    assert.ok(out.directive.payload.requested_fields.includes(field), field);
    assert.equal(p.calls.length, 0);
  }
});

test('a payload that smuggles a reserved name is refused before the model', () => {
  const p = port(accepted('actionable'));
  const req = lead(); req.event.payload.shard_id = 'billing.ledger';
  const out = evaluate(req, registry, { modelPort: p });
  assert.equal(out.directive.type, 'REQUEST_INPUT');
  assert.ok(out.directive.payload.requested_fields.includes('shard_id'));
  assert.equal(p.calls.length, 0);
});

test('advisory participation: an unavailable model does not block the routed action', () => {
  for (const status of ['no_port', 'timeout', 'error', 'invalid_output']) {
    const out = evaluate(lead(), registry, { modelPort: port({ status }) });
    assert.equal(out.directive.type, 'ACTIVATE_SHARD', status);
    assert.equal(out.diagnostics.matrix_row, 2);
  }
});

test('the actionless advisor cannot activate even when the model says actionable', () => {
  const out = evaluate(strategy(), registry, { modelPort: port(accepted('actionable', 0.99)) });
  assert.equal(out.directive.type, 'REQUEST_INPUT');
  assert.equal(out.diagnostics.matrix_row, 11);
});

test('advisor: accepted advice above the threshold is ADVISE; below it is unavailable support', () => {
  const ok = evaluate(strategy(), registry, { modelPort: port(accepted('not_actionable', 0.82, { advice: 'Pilot one branch first.' })) });
  assert.equal(ok.directive.type, 'ADVISE');
  assert.equal(ok.directive.payload.advice, 'Pilot one branch first.');
  assert.equal(ok.diagnostics.matrix_row, 10);

  const low = evaluate(strategy(), registry, { modelPort: port(accepted('not_actionable', 0.5, { advice: 'x' })) });
  assert.equal(low.directive.type, 'REQUEST_INPUT');
  assert.equal(low.diagnostics.model_status, 'below_threshold');
  assert.equal(classifyModel(accepted('not_actionable', 0.5), 0.65), 'unavailable');
});

test('needs_input mints a caller-held continuation for allowlisted fields only', () => {
  const out = evaluate(strategy(), registry, {
    modelPort: port(accepted('needs_input', 0.8, { requested_fields: ['risk_tolerance', 'shard_id'] })),
  });
  assert.equal(out.directive.type, 'REQUEST_INPUT');
  assert.deepEqual(out.directive.payload.requested_fields, ['risk_tolerance']);
  assert.deepEqual(out.continuation.requested_fields, ['risk_tolerance']);
  assert.equal(out.continuation.source_directive_id, out.directive.directive_id);
  const json = JSON.stringify(out.continuation);
  for (const banned of ['expires', 'ttl', 'ticket', 'scope', 'token']) assert.ok(!json.includes(banned), banned);
});

test('a valid continuation is revalidated and the follow-up evaluates in full', () => {
  const first = evaluate(strategy(), registry, {
    modelPort: port(accepted('needs_input', 0.8, { requested_fields: ['risk_tolerance'] })),
  });
  const followUp = strategy({ prompt: 'Should we open a second branch?', risk_tolerance: 'low' }, 'business.strategy.clarification.received');
  const p = port(accepted('not_actionable', 0.9, { advice: 'Lease, do not buy.' }));
  const out = evaluate(followUp, registry, { modelPort: p, continuation: first.continuation });
  assert.equal(out.directive.type, 'ADVISE');
  assert.equal(p.calls.length, 1);
  assert.deepEqual(Object.keys(p.calls[0].inputs).sort(), ['prompt', 'risk_tolerance']);
});

test('a tampered or stale continuation fails closed with no replacement and no model call', () => {
  const first = evaluate(strategy(), registry, {
    modelPort: port(accepted('needs_input', 0.8, { requested_fields: ['risk_tolerance'] })),
  });
  const followUp = strategy({ prompt: 'p', risk_tolerance: 'low' }, 'business.strategy.clarification.received');
  const tampered = [
    { ...first.continuation, requested_fields: ['risk_tolerance', 'objective'] },
    { ...first.continuation, persona_policy_version: 2 },
    { ...first.continuation, continuation_id: 'c-forged' },
  ];
  for (const continuation of tampered) {
    const p = port(accepted('not_actionable', 0.9, { advice: 'x' }));
    const out = evaluate(followUp, registry, { modelPort: p, continuation });
    assert.equal(out.directive.type, 'REQUEST_INPUT');
    assert.deepEqual(out.directive.payload.requested_fields, ['continuation']);
    assert.equal(out.continuation, undefined);
    assert.equal(p.calls.length, 0);
  }
});

test('evaluation is deterministic and never mutates the request', () => {
  const req = lead(); const snap = JSON.stringify(req);
  const a = evaluate(req, registry, { modelPort: port(accepted('actionable')) });
  const b = evaluate(req, registry, { modelPort: port(accepted('actionable')) });
  assert.deepEqual(a.directive, b.directive);
  assert.equal(JSON.stringify(req), snap);
});
