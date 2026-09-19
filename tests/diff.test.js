import { test } from 'node:test';
import assert from 'node:assert/strict';
import { diffRecords } from '../src/utils/diff.js';

test('reports changed, added and removed fields', () => {
  const a = { participation: 'advisory', threshold: 0, shared: 'x', gone: 'bye' };
  const b = { participation: 'required', threshold: 0.7, shared: 'x', added: 'hi' };

  const changes = diffRecords(a, b);
  const byField = Object.fromEntries(changes.map((c) => [c.field, c]));

  assert.equal(byField.participation.kind, 'changed');
  assert.equal(byField.participation.before, 'advisory');
  assert.equal(byField.participation.after, 'required');

  assert.equal(byField.threshold.kind, 'changed');
  assert.equal(byField.threshold.before, 0);
  assert.equal(byField.threshold.after, 0.7);

  assert.equal(byField.gone.kind, 'removed');
  assert.equal(byField.gone.before, 'bye');
  assert.equal(byField.gone.after, undefined);

  assert.equal(byField.added.kind, 'added');
  assert.equal(byField.added.before, undefined);
  assert.equal(byField.added.after, 'hi');

  assert.ok(!('shared' in byField), 'unchanged fields must not appear');
});

test('treats arrays by value, order-sensitive', () => {
  const a = { allowlist: ['email', 'phone'] };
  const same = { allowlist: ['email', 'phone'] };
  const reordered = { allowlist: ['phone', 'email'] };
  const different = { allowlist: ['email'] };

  assert.deepEqual(diffRecords(a, same), []);
  assert.equal(diffRecords(a, reordered).length, 1);
  assert.equal(diffRecords(a, different).length, 1);
});

test('never mutates either input', () => {
  const a = { x: 1, list: [1, 2] };
  const b = { x: 2, list: [1, 2, 3] };
  const aSnapshot = JSON.parse(JSON.stringify(a));
  const bSnapshot = JSON.parse(JSON.stringify(b));

  diffRecords(a, b);

  assert.deepEqual(a, aSnapshot);
  assert.deepEqual(b, bSnapshot);
});

test('two identical records produce no changes', () => {
  const a = { one: 1, two: [1, 2], three: { nested: true } };
  const b = { one: 1, two: [1, 2], three: { nested: true } };
  assert.deepEqual(diffRecords(a, b), []);
});
