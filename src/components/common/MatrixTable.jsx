import { MATRIX_ROWS } from '../../domain/matrix.js';

/** The full outcome matrix (every row `MATRIX_ROWS` publishes), with one row
 *  optionally marked as fired. Shared by the decision-detail rail
 *  (`MatrixStage`) and the interactive matrix explorer (`MatrixView`) — the
 *  table itself is defined once, never duplicated. */
export function MatrixTable({ firedRow = null, highlightDescription }) {
  return (
    <table className="matrix-mini-table">
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
            <tr key={row.row} aria-current={fired ? 'true' : undefined}>
              <td>
                {row.row}
                {fired && <span className="visually-hidden"> (fired)</span>}
              </td>
              <td>{row.route}</td>
              <td>{row.participation.join(' / ')}</td>
              <td>{row.modelResult}</td>
              <td>{row.directive}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
