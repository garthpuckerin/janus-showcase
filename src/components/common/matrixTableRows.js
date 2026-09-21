/* Pure row-ordering helper for `MatrixTable`'s phone card list: the fired
   row first, then the rest in their original table order. `MATRIX_ROWS` is
   the one data source for both the desktop table and the phone cards — this
   only reorders it, it never copies a row's fields into a second literal. */
import { MATRIX_ROWS } from '../../domain/matrix.js';

/**
 * @param {number|null} firedRow
 * @returns {ReadonlyArray} a NEW array; `MATRIX_ROWS` itself is never
 *  mutated or reordered. When nothing fired, the rows come back unchanged,
 *  in table order.
 */
export function orderRowsForCards(firedRow = null) {
  if (firedRow === null) return [...MATRIX_ROWS];
  const fired = MATRIX_ROWS.filter((row) => row.row === firedRow);
  const rest = MATRIX_ROWS.filter((row) => row.row !== firedRow);
  return Object.freeze([...fired, ...rest]);
}
