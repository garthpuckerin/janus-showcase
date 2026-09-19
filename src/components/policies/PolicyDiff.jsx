import { diffRecords } from '../../utils/diff.js';
import { policyRefLabel } from '../../utils/format.js';

function renderValue(value) {
  if (value === undefined) return <span className="not-applicable">(absent)</span>;
  if (Array.isArray(value)) return value.join(', ') || '(empty)';
  return String(value);
}

/** A side-by-side field diff between the canonical policy and a fixture
 *  draft — computed once by the pure `diffRecords()` helper, never
 *  re-derived per field in JSX. */
export function PolicyDiff({ before, after }) {
  const changes = diffRecords(before, after);

  return (
    <div className="panel policy-diff">
      <h2 className="rail-stage__heading">Diff</h2>
      <p className="page-framing">
        {policyRefLabel(before.policy_id, before.version)} → {policyRefLabel(after.policy_id, after.version)}
      </p>
      {changes.length === 0 ? (
        <p>No field differences.</p>
      ) : (
        <table className="policy-diff__table">
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
                <th scope="row">{change.field}</th>
                <td>{renderValue(change.before)}</td>
                <td>{renderValue(change.after)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="page-framing">
        This is a field diff only — the engine stores nothing to replay, so there is no "impact on past decisions"
        to show.
      </p>
    </div>
  );
}
