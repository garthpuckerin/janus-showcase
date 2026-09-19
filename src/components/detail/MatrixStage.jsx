import { MATRIX_ROWS } from '../../domain/matrix.js';

export function MatrixStage({ matrixRow, reached }) {
  return (
    <div className={`rail-stage${reached ? '' : ' rail-stage--not-reached'}`}>
      <h2 className="rail-stage__heading">Outcome matrix</h2>
      <div className="panel">
        {!reached ? (
          <p className="not-applicable">Not reached — a pre-matrix check failed before the matrix was consulted.</p>
        ) : (
          <table className="matrix-mini-table">
            <caption className="visually-hidden">All eleven outcome-matrix rows; the fired row is marked.</caption>
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
                const fired = row.row === matrixRow;
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
        )}
      </div>
    </div>
  );
}
