import { DirectiveChip } from '../../common/DirectiveChip.jsx';

/** One outcome-matrix row, as a card — never a table row. Renders exactly
 *  the fields `MATRIX_ROWS` publishes for this row; the fired row is marked
 *  in its own text, not colour alone. */
export function MatrixRowCard({ row, fired }) {
  return (
    <li className={`matrix-row-card${fired ? ' matrix-row-card--fired' : ''}`}>
      <div className="matrix-row-card__row">
        <span className="mono tabular-num">Row {row.row}</span>
        {fired && <span className="matrix-row-card__fired-tag">fired</span>}
      </div>
      <dl className="wizard-kv">
        <dt>Route</dt>
        <dd className="mono">{row.route}</dd>
        <dt>Participation</dt>
        <dd className="mono">{row.participation.join(' / ')}</dd>
        <dt>Model result</dt>
        <dd className="mono">{row.modelResult}</dd>
      </dl>
      <div className="matrix-row-card__directives">
        <DirectiveChip type={row.directive} />
        {row.fallback && (
          <span className="matrix-row-card__fallback">
            fallback <DirectiveChip type={row.fallback} />
          </span>
        )}
      </div>
    </li>
  );
}
