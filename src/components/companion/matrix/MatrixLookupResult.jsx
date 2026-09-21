import { DirectiveChip } from '../../common/DirectiveChip.jsx';
import { DataState } from '../../common/DataState.jsx';
import { MATRIX_ROWS } from '../../../domain/matrix.js';

/** The lookup's live result: the resolved directive at a glance, or — for a
 *  registry-invalid combination — the named rule it breaks, in a shared
 *  `DataState` warning. `resolveDirective` is never called for an invalid
 *  combination; `lookup` already reflects that (`matrixLookup.js`). */
export function MatrixLookupResult({ lookup }) {
  if (!lookup.valid) {
    return <DataState tone="warning" title="Not a registry-valid combination">{lookup.invalidRule}</DataState>;
  }

  const { row, directive, usedFallback } = lookup.resolved;
  return (
    <div className="card matrix-lookup__result">
      <span className="eyebrow">Resolved directive</span>
      <p className="matrix-lookup__chip">
        <DirectiveChip type={directive} /> <span className="matrix-row-tag">row {row} of {MATRIX_ROWS.length}</span>
      </p>
      <p className="page-framing">
        {usedFallback
          ? 'The fallback directive fired — ADVISE is not in this combination\'s allowlist.'
          : 'The row\'s own directive fired — no fallback was needed.'}
      </p>
    </div>
  );
}
