import { MatrixTable } from '../common/MatrixTable.jsx';

export function MatrixStage({ matrixRow, reached }) {
  return (
    <div className={`rail-stage${reached ? '' : ' rail-stage--not-reached'}`}>
      <h2 className="rail-stage__heading">Outcome matrix</h2>
      <div className="panel">
        {!reached ? (
          <p className="not-applicable">Not reached — a pre-matrix check failed before the matrix was consulted.</p>
        ) : (
          <MatrixTable firedRow={matrixRow} highlightDescription="the fired row is marked" />
        )}
      </div>
    </div>
  );
}
