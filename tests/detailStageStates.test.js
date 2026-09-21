/* Stage-rail gate: `stageStates()` is the single source of truth for the
   decision-detail rail header. Run it over every real ledger entry — never a
   hand-built fixture — so the assertions pin the actual domain output. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEDGER } from '../src/data/ledger.js';
import { stageStates, STAGE_COMPLETE, STAGE_FAILED, STAGE_NOT_REACHED } from '../src/components/detail/stageStates.js';

const STAGE_ORDER = ['request', 'pre-matrix', 'matrix', 'directive', 'fabric', 'outcome'];

test('every ledger entry resolves to exactly six stages, in the fixed rail order', () => {
  assert.ok(LEDGER.length > 0, 'expected a non-empty ledger to scan');
  for (const entry of LEDGER) {
    const stages = stageStates(entry);
    assert.equal(stages.length, 6, `${entry.scenario.id}: expected six stages`);
    assert.deepEqual(stages.map((s) => s.key), STAGE_ORDER, `${entry.scenario.id}: stage order`);
  }
});

test('a pre-matrix failure fails that stage and leaves every later stage not reached', () => {
  let sawOne = false;
  for (const entry of LEDGER) {
    if (!entry.evaluation.trace.some((step) => !step.ok)) continue;
    sawOne = true;
    const [, preMatrix, matrix, directive, fabric, outcome] = stageStates(entry);
    assert.equal(preMatrix.state, STAGE_FAILED, entry.scenario.id);
    for (const later of [matrix, directive, fabric, outcome]) {
      assert.equal(later.state, STAGE_NOT_REACHED, `${entry.scenario.id}: ${later.key}`);
    }
  }
  assert.ok(sawOne, 'expected at least one ledger entry with a pre-matrix failure');
});

test('a non-ACTIVATE_SHARD directive leaves both Fabric stages not reached', () => {
  let sawOne = false;
  for (const entry of LEDGER) {
    const { diagnostics, directive } = entry.evaluation;
    if (diagnostics.matrix_row === null) continue; // pre-matrix failure, covered separately
    if (directive.type === 'ACTIVATE_SHARD') continue;
    sawOne = true;
    const stages = stageStates(entry);
    assert.equal(stages.find((s) => s.key === 'fabric').state, STAGE_NOT_REACHED, entry.scenario.id);
    assert.equal(stages.find((s) => s.key === 'outcome').state, STAGE_NOT_REACHED, entry.scenario.id);
  }
  assert.ok(sawOne, 'expected at least one ledger entry with a non-ACTIVATE_SHARD directive');
});

test('a rejection fails the ticket stage with the verbatim rejection code, and leaves Outcome not reached', () => {
  let sawOne = false;
  for (const entry of LEDGER) {
    if (entry.fabric?.kind !== 'rejection') continue;
    sawOne = true;
    const stages = stageStates(entry);
    const fabricStage = stages.find((s) => s.key === 'fabric');
    assert.equal(fabricStage.state, STAGE_FAILED, entry.scenario.id);
    assert.equal(fabricStage.status, entry.fabric.rejection.code, entry.scenario.id);
    assert.equal(stages.find((s) => s.key === 'outcome').state, STAGE_NOT_REACHED, entry.scenario.id);
  }
  assert.ok(sawOne, 'expected at least one ledger entry with a fabric rejection');
});

test('a derived ticket marks all six stages complete', () => {
  let sawOne = false;
  for (const entry of LEDGER) {
    if (entry.fabric?.kind !== 'ticket') continue;
    sawOne = true;
    const stages = stageStates(entry);
    for (const stage of stages) {
      assert.equal(stage.state, STAGE_COMPLETE, `${entry.scenario.id}: ${stage.key}`);
    }
  }
  assert.ok(sawOne, 'expected at least one ledger entry with a derived ticket');
});

test('the matrix status line equals `row ${diagnostics.matrix_row}` whenever the matrix was reached', () => {
  let sawOne = false;
  for (const entry of LEDGER) {
    const { diagnostics } = entry.evaluation;
    if (diagnostics.matrix_row === null) continue;
    sawOne = true;
    const matrixStage = stageStates(entry).find((s) => s.key === 'matrix');
    assert.equal(matrixStage.status, `row ${diagnostics.matrix_row}`, entry.scenario.id);
  }
  assert.ok(sawOne, 'expected at least one ledger entry that reaches the matrix');
});
