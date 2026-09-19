import { DirectiveChip } from '../common/DirectiveChip.jsx';

/** The resolved directive for the current combination, or — when the
 *  combination is not registry-valid — the named rule it breaks. Everything
 *  shown comes from `resolveDirective()` / `invalidCombinationRule()`, never
 *  computed again here. */
export function MatrixResultPanel({ resolved, invalidRule }) {
  if (invalidRule) {
    return (
      <div className="panel matrix-result matrix-result--invalid" role="status">
        <h2 className="rail-stage__heading">Not a registry-valid combination</h2>
        <p>{invalidRule}</p>
      </div>
    );
  }

  return (
    <div className="panel matrix-result" role="status">
      <h2 className="rail-stage__heading">Resolved directive</h2>
      <p>
        <DirectiveChip type={resolved.directive} /> <span className="matrix-row-tag">row {resolved.row}</span>
      </p>
      <p className="page-framing">
        {resolved.usedFallback
          ? 'The fallback directive fired — ADVISE is not in this combination\'s allowlist.'
          : 'The row\'s own directive fired — no fallback was needed.'}
      </p>
    </div>
  );
}
