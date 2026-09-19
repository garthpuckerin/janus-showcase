/* Ledger gate: the fixtures are only trustworthy if every row in the cockpit's
   history is the literal output of the real domain functions. These assertions
   pin that shape, the fabric boundary (a ticket/rejection exists exactly when
   it should), and the fixture set's coverage — including what must NOT exist
   (a directive with a fabric result beside it that isn't ACTIVATE_SHARD, a
   hand-typed absolute date in any fixture file). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LEDGER, REGISTERED_SHARDS } from '../src/data/ledger.js';
import { SCENARIOS } from '../src/data/scenarios.js';
import { ACTION_POLICIES } from '../src/domain/policies.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test('exactly one directive exists per scenario, correlated by request_id', () => {
  assert.equal(LEDGER.length, SCENARIOS.length);
  for (const { scenario, evaluation } of LEDGER) {
    assert.ok(evaluation.directive, scenario.id);
    assert.equal(evaluation.directive.request_id, scenario.request.request_id, scenario.id);
  }
});

test('a fabric result exists only beside ACTIVATE_SHARD, and always beside it', () => {
  for (const { scenario, evaluation, fabric } of LEDGER) {
    if (evaluation.directive.type === 'ACTIVATE_SHARD') {
      assert.ok(fabric, `${scenario.id} should carry a fabric result`);
    } else {
      assert.equal(fabric, null, `${scenario.id} must not cross the boundary`);
    }
  }
});

test('every ticket carries exact correlation and exact policy scopes', () => {
  const tickets = LEDGER.filter((entry) => entry.fabric?.kind === 'ticket');
  assert.ok(tickets.length > 0, 'the fixture set must include at least one ticket');
  for (const { evaluation, fabric } of tickets) {
    const { ticket, outcome } = fabric;
    assert.equal(ticket.request_id, evaluation.directive.request_id);
    assert.equal(ticket.directive_id, evaluation.directive.directive_id);
    assert.equal(outcome.ticket_id, ticket.ticket_id);
    assert.equal(outcome.request_id, ticket.request_id);
    assert.equal(outcome.directive_id, ticket.directive_id);

    const policy = ACTION_POLICIES.find(
      (p) => p.policy_id === ticket.action_policy_id && p.version === ticket.action_policy_version,
    );
    assert.ok(policy, 'ticket must reference a real action policy');
    assert.deepEqual([...ticket.allowed_scopes].sort(), [...policy.required_scopes].sort());
    for (const scope of ticket.allowed_scopes) {
      assert.ok(!policy.forbidden_scopes.includes(scope), `${scope} is forbidden by policy`);
    }
    assert.ok(REGISTERED_SHARDS.includes(ticket.shard_id));
  }
});

test('every rejection carries no ticket and no outcome', () => {
  const rejections = LEDGER.filter((entry) => entry.fabric?.kind === 'rejection');
  assert.ok(rejections.length > 0, 'the fixture set must include at least one rejection');
  for (const { fabric } of rejections) {
    assert.equal(fabric.ticket, undefined);
    assert.equal(fabric.outcome, undefined);
    assert.ok(fabric.rejection.code, 'rejection must carry a code');
  }
});

test('every pre-matrix failure made no model call and resolved no matrix row', () => {
  for (const { scenario, evaluation, modelCalls } of LEDGER) {
    if (evaluation.diagnostics.matrix_row === null) {
      assert.equal(modelCalls, 0, `${scenario.id} is pre-matrix and must not call the model`);
    }
  }
});

test('no scenario calls the port more than once', () => {
  for (const { scenario, modelCalls } of LEDGER) {
    assert.ok(modelCalls <= 1, `${scenario.id} called the port ${modelCalls} times`);
  }
});

test('request_ids are unique across the fixture set', () => {
  const ids = SCENARIOS.map((s) => s.request.request_id);
  assert.equal(new Set(ids).size, ids.length);
});

test('the fixture set covers all three directive types', () => {
  const types = new Set(LEDGER.map((entry) => entry.evaluation.directive.type));
  assert.deepEqual([...types].sort(), ['ACTIVATE_SHARD', 'ADVISE', 'REQUEST_INPUT']);
});

test('the fixture set covers at least two distinct rejection codes', () => {
  const codes = new Set(
    LEDGER.filter((entry) => entry.fabric?.kind === 'rejection').map((entry) => entry.fabric.rejection.code),
  );
  assert.ok(codes.size >= 2, `only found rejection codes: ${[...codes].join(', ')}`);
});

test('the fixture set fires at least five distinct matrix rows', () => {
  const rows = new Set(
    LEDGER.map((entry) => entry.evaluation.diagnostics.matrix_row).filter((row) => row !== null),
  );
  assert.ok(rows.size >= 5, `only found matrix rows: ${[...rows].join(', ')}`);
});

test('no fixture file under src/data types a hand-written absolute year', () => {
  const dataDir = path.resolve(__dirname, '../src/data');
  const files = fs.readdirSync(dataDir).filter((f) => f.endsWith('.js'));
  assert.ok(files.length > 0);
  const yearPattern = /\b20\d\d\b/;
  for (const file of files) {
    const text = fs.readFileSync(path.join(dataDir, file), 'utf8');
    assert.ok(!yearPattern.test(text), `${file} contains what looks like an absolute year`);
  }
});
