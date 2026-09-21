import { MATRIX_ROWS } from '../../domain/matrix.js';
import { orderRowsForCards } from './matrixTableRows.js';

/** The full outcome matrix (every row `MATRIX_ROWS` publishes), with one row
 *  optionally marked as fired. Shared by the decision-detail rail
 *  (`MatrixStage`), the Advisor walk and the interactive matrix explorer
 *  (`MatrixView`) — the table itself is defined once, never duplicated.
 *
 *  `density`: `'compact'` (default) renders exactly as before — the rail and
 *  the Advisor screen depend on that. `'full'` is the explorer's normal
 *  `.data-table` row height and `--text-sm` cells.
 *
 *  On phones (`max-width: 768px`) the same rows re-flow into stacked cards —
 *  one table, one data source, reordered (not duplicated) so the fired row
 *  reads first; the reorder is driven by the pure `orderRowsForCards()`. */
export function MatrixTable({ firedRow = null, highlightDescription, density = 'compact' }) {
  const phoneOrder = orderRowsForCards(firedRow);
  const orderIndex = new Map(phoneOrder.map((row, index) => [row.row, index]));
  const tableClassName = `data-table matrix-mini-table${density === 'full' ? ' matrix-mini-table--full' : ''}`;

  return (
    <div className="data-table-wrap">
      <table className={tableClassName}>
        <caption className="visually-hidden">
          All {MATRIX_ROWS.length} outcome-matrix rows{highlightDescription ? `; ${highlightDescription}` : ''}.
        </caption>
        <thead>
          <tr>
            <th scope="col">Row</th>
            <th scope="col">Route</th>
            <th scope="col">Participation</th>
            <th scope="col">Model result</th>
            <th scope="col">Directive</th>
          </tr>
        </thead>
        <tbody>
          {MATRIX_ROWS.map((row) => {
            const fired = row.row === firedRow;
            return (
              <tr
                key={row.row}
                aria-current={fired ? 'true' : undefined}
                style={{ '--phone-order': orderIndex.get(row.row) }}
              >
                <td data-label="Row">
                  {row.row}
                  {fired && <span className="visually-hidden"> (fired)</span>}
                  {fired && <span className="matrix-mini-table__fired-tag" aria-hidden="true">fired</span>}
                </td>
                <td data-label="Route">{row.route}</td>
                <td data-label="Participation">{row.participation.join(' / ')}</td>
                <td data-label="Model result">{row.modelResult}</td>
                <td data-label="Directive">{row.directive}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
