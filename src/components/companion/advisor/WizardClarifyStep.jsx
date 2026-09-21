import { fieldMeta } from '../../advisor/advisorFieldMeta.js';
import { ADVISOR_PORT_PRESETS } from '../../advisor/advisorPresets.js';
import { TAMPER_MODES } from '../../advisor/advisorFlow.js';
import { WizardField } from './WizardField.jsx';

/** Step 04 — answer exactly the fields the continuation's directive named,
 *  looked up the same way the Ask step's fields are. Tamper controls stay
 *  behind "Advanced" per the design contract. */
export function WizardClarifyStep({
  formId,
  requestedFields,
  values,
  onFieldChange,
  portKey,
  onPortKeyChange,
  tamperMode,
  onTamperModeChange,
  onSubmit,
}) {
  return (
    <div className="advisor-wizard__screen">
      <h2 className="advisor-wizard__heading">Clarify</h2>
      <form
        id={formId}
        className="wizard-form"
        aria-label="Clarify the fields the advisor persona requested"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        {requestedFields.map((field) => (
          <WizardField
            key={field}
            name={field}
            meta={fieldMeta(field)}
            value={values[field] ?? ''}
            onChange={onFieldChange}
            idPrefix="wizard-clarify"
          />
        ))}
        <div className="field">
          <label htmlFor="wizard-clarify-port">Model port result (scripted)</label>
          <select id="wizard-clarify-port" value={portKey} onChange={(event) => onPortKeyChange(event.target.value)}>
            {Object.entries(ADVISOR_PORT_PRESETS).map(([key, preset]) => (
              <option key={key} value={key}>
                {preset.label}
              </option>
            ))}
          </select>
          <p className="wizard-field__help">No model runs in this demo — the port result is scripted for the walk.</p>
        </div>
      </form>

      <details className="advisor-wizard__details">
        <summary>Advanced: tamper with the continuation</summary>
        <fieldset className="wizard-tamper">
          <legend>Tamper with the continuation before sending it back</legend>
          <label className="wizard-tamper__option">
            <input
              type="radio"
              name="wizard-tamper"
              value="none"
              checked={tamperMode === 'none'}
              onChange={() => onTamperModeChange('none')}
            />
            Send it as held — no tampering
          </label>
          {Object.entries(TAMPER_MODES).map(([key, tamper]) => (
            <label key={key} className="wizard-tamper__option">
              <input
                type="radio"
                name="wizard-tamper"
                value={key}
                checked={tamperMode === key}
                onChange={() => onTamperModeChange(key)}
              />
              <span>
                {tamper.label}
                <span className="wizard-tamper__description">{tamper.description}</span>
              </span>
            </label>
          ))}
        </fieldset>
      </details>
    </div>
  );
}
