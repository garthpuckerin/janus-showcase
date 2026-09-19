import { TAMPER_MODES } from './advisorFlow.js';

/** A choice of "send the continuation as held" or one of three ways to
 *  corrupt it first — every tampered path is expected to fail closed. */
export function TamperControls({ mode, onChange }) {
  return (
    <fieldset className="advisor-tamper">
      <legend>Tamper with the continuation before sending it back</legend>
      <label className="advisor-tamper__option">
        <input type="radio" name="advisor-tamper" value="none" checked={mode === 'none'} onChange={() => onChange('none')} />
        Send it as held — no tampering
      </label>
      {Object.entries(TAMPER_MODES).map(([key, tamper]) => (
        <label key={key} className="advisor-tamper__option">
          <input type="radio" name="advisor-tamper" value={key} checked={mode === key} onChange={() => onChange(key)} />
          {tamper.label}
          <span className="advisor-tamper__description">{tamper.description}</span>
        </label>
      ))}
    </fieldset>
  );
}
