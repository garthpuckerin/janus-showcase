import { Payload } from '../../common/Payload.jsx';

const NOT_CARRIED = Object.freeze([
  'No authority',
  'No ticket',
  'No expiry',
  'No single-use or replay protection',
]);

/** Step 03 — the continuation held by the caller. This step's content IS the
 *  point: what it deliberately does not carry, as four plain rows, then the
 *  document itself behind its own `<details>`. */
export function WizardContinuationStep({ continuation }) {
  return (
    <div className="advisor-wizard__screen">
      <h2 className="advisor-wizard__heading">Held by the caller</h2>

      <div className="wizard-continuation">
        <span className="eyebrow">What it does not carry</span>
        <ul className="wizard-continuation__list">
          {NOT_CARRIED.map((line) => (
            <li key={line}>
              <span className="wizard-continuation__marker" aria-hidden="true">absent</span>
              {line}
            </li>
          ))}
        </ul>
        <p className="page-framing">The caller owns those, not Janus.</p>
      </div>

      <details className="advisor-wizard__details">
        <summary>Show DecisionContinuationV2</summary>
        <Payload caption="DecisionContinuationV2" value={continuation} />
      </details>
    </div>
  );
}
