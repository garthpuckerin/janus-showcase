/* Attention-grouping gate (src/utils/attention.js), run over the real built
   ledger — the phone companion's home tab. Pins: every rejection lands in
   `rejected` with its verbatim code; every pre-matrix failure lands in
   `failed-closed` with the failed check's own name; no entry appears in two
   groups; ADVISE and succeeded-ticket entries appear in none; the totals
   agree; and the ledger itself is never mutated. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupAttention } from '../src/utils/attention.js';
import { LEDGER } from '../src/data/ledger.js';

function allItems(groups) {
  return groups.flatMap((group) => group.items.map((item) => ({ ...item, groupId: group.id })));
}

test('every rejection is grouped under "rejected" with its verbatim code as the reason', () => {
  const { groups } = groupAttention(LEDGER);
  const rejectedGroup = groups.find((group) => group.id === 'rejected');
  const rejectionEntries = LEDGER.filter((entry) => entry.fabric?.kind === 'rejection');

  assert.ok(rejectionEntries.length > 0, 'the fixture set must include at least one rejection');
  assert.ok(rejectedGroup, 'expected a "rejected" group');
  assert.equal(rejectedGroup.items.length, rejectionEntries.length);

  for (const { entry, reason } of rejectedGroup.items) {
    assert.equal(entry.fabric.kind, 'rejection');
    assert.equal(reason, entry.fabric.rejection.code);
  }
});

test('every pre-matrix failure is grouped under "failed-closed" with the failed check\'s name', () => {
  const { groups } = groupAttention(LEDGER);
  const failedClosedGroup = groups.find((group) => group.id === 'failed-closed');
  const preMatrixEntries = LEDGER.filter((entry) => entry.evaluation.diagnostics.matrix_row === null);

  assert.ok(preMatrixEntries.length > 0, 'the fixture set must include at least one pre-matrix failure');
  assert.ok(failedClosedGroup, 'expected a "failed-closed" group');
  assert.equal(failedClosedGroup.items.length, preMatrixEntries.length);

  for (const { entry, reason } of failedClosedGroup.items) {
    const failedStep = entry.evaluation.trace.find((step) => step.ok === false);
    assert.ok(failedStep, `${entry.scenario.id} has no failed trace step`);
    assert.equal(reason, failedStep.check);
  }
});

test('needs-input entries carry the requested fields, or say none were requested', () => {
  const { groups } = groupAttention(LEDGER);
  const needsInputGroup = groups.find((group) => group.id === 'needs-input');
  if (!needsInputGroup) return; // fine if the fixture set has none of this shape

  for (const { entry, reason } of needsInputGroup.items) {
    assert.equal(entry.evaluation.directive.type, 'REQUEST_INPUT');
    assert.notEqual(entry.evaluation.diagnostics.matrix_row, null);
    const fields = entry.evaluation.directive.payload.requested_fields ?? [];
    assert.equal(reason, fields.length ? fields.join(', ') : 'no further field requested');
  }
});

test('no entry appears in more than one group', () => {
  const { groups } = groupAttention(LEDGER);
  const ids = allItems(groups).map(({ entry }) => entry.scenario.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('ADVISE entries and succeeded tickets appear in no group', () => {
  const { groups } = groupAttention(LEDGER);
  const grouped = new Set(allItems(groups).map(({ entry }) => entry.scenario.id));

  const shouldBeAbsent = LEDGER.filter(
    (entry) => entry.evaluation.directive.type === 'ADVISE' || entry.fabric?.kind === 'ticket',
  );
  assert.ok(shouldBeAbsent.length > 0, 'the fixture set must include ADVISE and/or a succeeded ticket');
  for (const entry of shouldBeAbsent) {
    assert.equal(grouped.has(entry.scenario.id), false, `${entry.scenario.id} should need nothing`);
  }
});

test('needing equals the sum of the group sizes, and total equals the ledger length', () => {
  const { total, needing, groups } = groupAttention(LEDGER);
  assert.equal(total, LEDGER.length);
  assert.equal(
    needing,
    groups.reduce((sum, group) => sum + group.items.length, 0),
  );
});

test('groups are newest first', () => {
  const { groups } = groupAttention(LEDGER);
  for (const group of groups) {
    const times = group.items.map(({ entry }) => new Date(entry.scenario.occurredAt).getTime());
    const sorted = [...times].sort((a, b) => b - a);
    assert.deepEqual(times, sorted, `${group.id} is not newest-first`);
  }
});

test('grouping never mutates the ledger', () => {
  const before = JSON.parse(JSON.stringify(LEDGER, (key, value) => (typeof value === 'function' ? undefined : value)));
  groupAttention(LEDGER);
  const after = JSON.parse(JSON.stringify(LEDGER, (key, value) => (typeof value === 'function' ? undefined : value)));
  assert.deepEqual(after, before);
});
