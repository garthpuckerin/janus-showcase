import { MATRIX_ROWS } from '../../../domain/matrix.js';

/** Stage 03's body: never the full matrix table — only the fired row, as a
 *  small label/value block, plus its position among every row the matrix
 *  publishes (both numbers derived from `MATRIX_ROWS`, never hand-typed). */
export function MatrixBody({ matrixRow, reached }) {
  if (!reached) {
    return <p className="not-applicable">Not reached — a pre-matrix check failed before the matrix was consulted.</p>;
  }

  const row = MATRIX_ROWS.find((candidate) => candidate.row === matrixRow);

  return (
    <div className="story-fields">
      <div className="story-field">
        <span className="story-field__label">Route</span>
        <span className="story-field__value mono">{row.route}</span>
      </div>
      <div className="story-field">
        <span className="story-field__label">Participation</span>
        <span className="story-field__value mono">{row.participation.join(' / ')}</span>
      </div>
      <div className="story-field">
        <span className="story-field__label">Model result</span>
        <span className="story-field__value mono">{row.modelResult}</span>
      </div>
      <div className="story-field">
        <span className="story-field__label">Directive</span>
        <span className="story-field__value mono">{row.directive}</span>
      </div>
      <p className="matrix-row-tag">
        Row {row.row} of {MATRIX_ROWS.length}
      </p>
    </div>
  );
}
