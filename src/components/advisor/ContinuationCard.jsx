const NOT_CARRIED = Object.freeze([
  'No authority — it cannot act on the caller\'s behalf.',
  'No ticket — it is not a credential for anything.',
  'No expiry — the continuation itself carries no time limit.',
  'No single-use or replay protection — nothing here stops it being sent again.',
]);

/** Every field of a caller-held continuation, shown verbatim, plus an
 *  explicit list of what it deliberately does not carry. The caller — not
 *  Janus — owns all of that. */
export function ContinuationCard({ continuation }) {
  return (
    <div className="panel advisor-continuation">
      <h2 className="rail-stage__heading">Continuation — held by the caller</h2>
      <dl>
        {Object.entries(continuation).map(([key, value]) => (
          <div key={key} className="advisor-continuation__row">
            <dt>{key}</dt>
            <dd>{Array.isArray(value) ? value.join(', ') || '(none)' : String(value)}</dd>
          </div>
        ))}
      </dl>
      <p className="page-framing">
        This is data the caller now holds until it sends a follow-up request. It carries none of the following —
        the caller owns those, not Janus:
      </p>
      <ul className="advisor-continuation__disclaimers">
        {NOT_CARRIED.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );
}
