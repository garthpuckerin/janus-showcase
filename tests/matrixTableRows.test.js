/* Matrix-table-rows gate: pins the pure row-ordering helper the phone card
   list is built from — the fired row first, all eleven rows kept, the
   canonical `MATRIX_ROWS` never mutated, and no reorder at all when nothing
   fired. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MATRIX_ROWS } from '../src/domain/matrix.js';
import { orderRowsForCards } from '../src/components/common/matrixTableRows.js';

test('the fired row comes first and all eleven rows are kept', () => {
  const ordered = orderRowsForCards(8);
  assert.equal(ordered.length, MATRIX_ROWS.length);
  assert.equal(ordered[0].row, 8);
  assert.deepEqual(new Set(ordered.map((r) => r.row)), new Set(MATRIX_ROWS.map((r) => r.row)));
});

test('never mutates MATRIX_ROWS', () => {
  const snapshot = JSON.parse(JSON.stringify(MATRIX_ROWS));
  orderRowsForCards(3);
  orderRowsForCards(null);
  orderRowsForCards(11);
  assert.deepEqual(MATRIX_ROWS, snapshot);
});

test('with nothing fired, rows come back unchanged in table order', () => {
  const ordered = orderRowsForCards(null);
  assert.deepEqual(ordered, MATRIX_ROWS);
});

test('every row number from the matrix appears exactly once, for any fired row', () => {
  for (const row of MATRIX_ROWS) {
    const ordered = orderRowsForCards(row.row);
    const counts = new Map();
    for (const r of ordered) counts.set(r.row, (counts.get(r.row) ?? 0) + 1);
    for (const count of counts.values()) assert.equal(count, 1);
    assert.equal(counts.size, MATRIX_ROWS.length);
  }
});
