import { Payload } from '../common/Payload.jsx';

const NOT_CARRIED = Object.freeze([
  'No authority',
  'No ticket',
  'No expiry',
  'No single-use or replay protection',
]);

/** The caller-held continuation, verbatim, beside an explicit list of what it
 *  deliberately does not carry. The list reads as plain hairline-separated
 *  rows with a neutral "absent" marker — this is a statement of fact, not a
 *  warning, so it never borrows the danger/warning treatment. The caller —
 *  not Janus — owns all of it. */
export function ContinuationCard({ continuation }) {
  return (
    <div className="advisor-continuation">
      <Payload caption="DecisionContinuationV2" value={continuation} />
      <div className="advisor-continuation__absent">
        <span className="eyebrow">What it does not carry</span>
        <ul className="advisor-continuation__absent-list">
          {NOT_CARRIED.map((line) => (
            <li key={line}>
              <span className="advisor-continuation__absent-marker" aria-hidden="true">absent</span>
              {line}
            </li>
          ))}
        </ul>
        <p className="page-heading__lede">The caller owns those, not Janus.</p>
      </div>
    </div>
  );
}
