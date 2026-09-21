import { DirectiveChip } from '../common/DirectiveChip.jsx';
import { DataState } from '../common/DataState.jsx';

/** The resolved directive for the current combination, or — when the
 *  combination is not registry-valid — the named rule it breaks, in a
 *  `DataState` tone warning. Everything shown comes from
 *  `resolveDirective()` / `invalidCombinationRule()`, never computed again
 *  here. */
export function MatrixResultPanel({ resolved, invalidRule }) {
  if (invalidRule) {
    return <DataState tone="warning" title="Not a registry-valid combination">{invalidRule}</DataState>;
  }

  return (
    <div className="card matrix-result" role="status">
      <span className="eyebrow">Resolved directive</span>
      <p className="matrix-result__directive">
        <DirectiveChip type={resolved.directive} /> <span className="matrix-row-tag">row {resolved.row}</span>
      </p>
      <p className="page-heading__lede">
        {resolved.usedFallback
          ? 'The fallback directive fired — ADVISE is not in this combination\'s allowlist.'
          : 'The row\'s own directive fired — no fallback was needed.'}
      </p>
    </div>
  );
}
