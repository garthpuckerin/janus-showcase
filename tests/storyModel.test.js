/* Phone decision-story gate: `storyModel.js` is the single source of truth
   for which stage explains a decision and the one-line verdict a human sees
   before opening any stage. Run over the real built LEDGER — never a
   hand-built fixture — so the assertions pin the actual domain output, the
   same discipline tests/detailStageStates.test.js and tests/attention.test.js
   already hold the desktop rail and the Attention grouping to. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEDGER } from '../src/data/ledger.js';
import { explainingStage, storyVerdict } from '../src/components/companion/story/storyModel.js';

function verdictText(entry) {
  return storyVerdict(entry)
    .map((segment) => segment.value)
    .join('');
}

test('explainingStage returns the pre-matrix stage for every pre-matrix failure', () => {
  let sawOne = false;
  for (const entry of LEDGER) {
    if (!entry.evaluation.trace.some((step) => !step.ok)) continue;
    sawOne = true;
    assert.equal(explainingStage(entry), 'pre-matrix', entry.scenario.id);
  }
  assert.ok(sawOne, 'expected at least one pre-matrix failure in the ledger');
});

test('explainingStage returns the fabric stage whenever a directive crossed the boundary', () => {
  const kinds = new Set();
  for (const entry of LEDGER) {
    if (!entry.fabric) continue;
    kinds.add(entry.fabric.kind);
    assert.equal(explainingStage(entry), 'fabric', entry.scenario.id);
  }
  assert.deepEqual([...kinds].sort(), ['rejection', 'ticket'], 'the ledger must exercise both Fabric results');
});

test('explainingStage returns the directive stage when the checks passed and nothing crossed', () => {
  let sawOne = false;
  for (const entry of LEDGER) {
    const preMatrixFailed = entry.evaluation.trace.some((step) => !step.ok);
    if (preMatrixFailed || entry.fabric) continue;
    sawOne = true;
    assert.equal(explainingStage(entry), 'directive', entry.scenario.id);
  }
  assert.ok(sawOne, 'expected at least one entry that explains at the directive stage');
});

/* Deciding is not acting. A directive is never described as an activation. */
test('no verdict claims a directive "activated" anything, and a rejection says nothing ran', () => {
  for (const entry of LEDGER) {
    const sentence = storyVerdict(entry).map((segment) => segment.value).join('');
    assert.ok(!/^Activated\b/.test(sentence), `${entry.scenario.id}: "${sentence}"`);
    if (entry.fabric?.kind === 'rejection') assert.match(sentence, /nothing ran/, entry.scenario.id);
    if (entry.evaluation.directive.type === 'REQUEST_INPUT' && !entry.evaluation.trace.some((s) => !s.ok)) {
      const held = Boolean(entry.evaluation.continuation);
      assert.equal(/a continuation is held by the caller/.test(sentence), held, entry.scenario.id);
    }
  }
});

test('storyVerdict carries the verbatim rejection code for every rejection', () => {
  let sawOne = false;
  for (const entry of LEDGER) {
    if (entry.fabric?.kind !== 'rejection') continue;
    sawOne = true;
    assert.ok(verdictText(entry).includes(entry.fabric.rejection.code), entry.scenario.id);
  }
  assert.ok(sawOne, 'expected at least one rejection in the ledger');
});

test("storyVerdict carries the failed check's name for every pre-matrix failure", () => {
  let sawOne = false;
  for (const entry of LEDGER) {
    const failed = entry.evaluation.trace.find((step) => !step.ok);
    if (!failed) continue;
    sawOne = true;
    assert.ok(verdictText(entry).includes(failed.check), entry.scenario.id);
  }
  assert.ok(sawOne, 'expected at least one pre-matrix failure in the ledger');
});

test('storyVerdict carries every requested field name for a needs-input result', () => {
  let sawOne = false;
  for (const entry of LEDGER) {
    const preMatrixFailed = entry.evaluation.trace.some((step) => !step.ok);
    if (preMatrixFailed || entry.evaluation.directive.type !== 'REQUEST_INPUT') continue;
    const fields = entry.evaluation.directive.payload.requested_fields ?? [];
    if (fields.length === 0) continue;
    sawOne = true;
    const text = verdictText(entry);
    for (const field of fields) assert.ok(text.includes(field), `${entry.scenario.id}: ${field}`);
  }
  assert.ok(sawOne, 'expected at least one needs-input result with requested fields');
});

test('neither function mutates its input', () => {
  const strip = (key, value) => (typeof value === 'function' ? undefined : value);
  for (const entry of LEDGER) {
    const before = JSON.parse(JSON.stringify(entry, strip));
    explainingStage(entry);
    storyVerdict(entry);
    const after = JSON.parse(JSON.stringify(entry, strip));
    assert.deepEqual(after, before, entry.scenario.id);
  }
});

test('every ledger entry yields a non-empty verdict', () => {
  for (const entry of LEDGER) {
    const segments = storyVerdict(entry);
    assert.ok(Array.isArray(segments) && segments.length > 0, entry.scenario.id);
    assert.ok(verdictText(entry).trim().length > 0, entry.scenario.id);
  }
});
