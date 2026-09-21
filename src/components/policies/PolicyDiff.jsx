import { diffRecords } from '../../utils/diff.js';
import { policyRefLabel } from '../../utils/format.js';
import { DataState } from '../common/DataState.jsx';

function renderValue(value) {
  if (value === undefined) return <span className="not-applicable">(absent)</span>;
  if (Array.isArray(value)) return value.join(', ') || '(empty)';
  return String(value);
}

const KIND_LABEL = Object.freeze({ changed: 'changed', added: 'added', removed: 'removed' });

/** A side-by-side field diff between the canonical policy and a fixture
 *  draft — computed once by the pure `diffRecords()` helper, never
 *  re-derived per field in JSX. Every row is a difference, so every row
 *  carries the accent-soft tint; the kind of change (changed / added /
 *  removed) is always named in text, never colour alone. */
export function PolicyDiff({ before, after }) {
  const changes = diffRecords(before, after);

  return (
    <div className="card policy-diff">
      <div className="card__header">
        <span className="eyebrow">Diff</span>
      </div>
      <p className="page-heading__lede">
        {policyRefLabel(before.policy_id, before.version)} → {policyRefLabel(after.policy_id, after.version)}
      </p>
      {changes.length === 0 ? (
        <DataState tone="neutral">No field differences.</DataState>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table policy-diff__table">
            <caption className="visually-hidden">Fields that differ between the two policy versions.</caption>
            <thead>
              <tr>
                <th scope="col">Field</th>
                <th scope="col">Before</th>
                <th scope="col">After</th>
              </tr>
            </thead>
            <tbody>
              {changes.map((change) => (
                <tr key={change.field}>
                  <th scope="row" data-label="Field" className="mono">{change.field}</th>
                  <td data-label="Before" className="mono">{renderValue(change.before)}</td>
                  <td data-label="After" className="mono">
                    {renderValue(change.after)}{' '}
                    <span className="policy-diff__kind">({KIND_LABEL[change.kind]})</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="page-heading__lede">
        This is a field diff only — the engine stores nothing to replay, so there is no "impact on past decisions"
        to show.
      </p>
    </div>
  );
}
