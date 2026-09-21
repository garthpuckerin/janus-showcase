import { fieldMeta } from './advisorFieldMeta.js';
import { ADVISOR_PORT_PRESETS } from './advisorPresets.js';
import { AdvisorField } from './AdvisorField.jsx';
import { TamperControls } from './TamperControls.jsx';

/** Step 2 — answer exactly the fields the continuation's directive named,
 *  looked up the same way the Ask step's fields are: from the policy's own
 *  vocabulary, never a hardcoded field list. */
export function AdvisorClarifyForm({
  requestedFields,
  values,
  onFieldChange,
  portKey,
  onPortKeyChange,
  tamperMode,
  onTamperModeChange,
  onSubmit,
  disabled,
}) {
  return (
    <form
      className="advisor-form"
      aria-label="Clarify the fields the advisor persona requested"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      {requestedFields.map((field) => (
        <AdvisorField
          key={field}
          name={field}
          meta={fieldMeta(field)}
          value={values[field] ?? ''}
          onChange={onFieldChange}
          idPrefix="advisor-clarify"
        />
      ))}
      <div className="field">
        <label htmlFor="advisor-clarify-port">Model port result (scripted)</label>
        <select
          id="advisor-clarify-port"
          value={portKey}
          onChange={(event) => onPortKeyChange(event.target.value)}
        >
          {Object.entries(ADVISOR_PORT_PRESETS).map(([key, preset]) => (
            <option key={key} value={key}>
              {preset.label}
            </option>
          ))}
        </select>
        <p className="advisor-field__help">No model runs in this demo — the port result is scripted for the walk.</p>
      </div>
      <details className="advisor-tamper-details">
        <summary>Advanced: tamper with the continuation</summary>
        <TamperControls mode={tamperMode} onChange={onTamperModeChange} />
      </details>
      <button type="submit" className="button" disabled={disabled}>
        Send clarification
      </button>
    </form>
  );
}
