import { ADVISOR_POLICY } from './advisorFlow.js';
import { fieldMeta } from './advisorFieldMeta.js';
import { ADVISOR_PORT_PRESETS } from './advisorPresets.js';
import { AdvisorField } from './AdvisorField.jsx';

/* Step-1 fields are exactly the policy's own allowlist, filtered to the
   fields meant to be asked up front — never a separate hand-kept list. */
const ASK_FIELDS = ADVISOR_POLICY.input_allowlist.filter((field) => fieldMeta(field).stage === 'ask');

export function AdvisorAskForm({ values, onFieldChange, portKey, onPortKeyChange, onSubmit, disabled }) {
  return (
    <form
      className="advisor-form"
      aria-label="Ask the advisor persona"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      {ASK_FIELDS.map((field) => (
        <AdvisorField
          key={field}
          name={field}
          meta={fieldMeta(field)}
          value={values[field] ?? ''}
          onChange={onFieldChange}
          idPrefix="advisor-ask"
        />
      ))}
      <div className="field">
        <label htmlFor="advisor-ask-port">Model port result (scripted)</label>
        <select id="advisor-ask-port" value={portKey} onChange={(event) => onPortKeyChange(event.target.value)}>
          {Object.entries(ADVISOR_PORT_PRESETS).map(([key, preset]) => (
            <option key={key} value={key}>
              {preset.label}
            </option>
          ))}
        </select>
        <p className="advisor-field__help">No model runs in this demo — the port result is scripted for the walk.</p>
      </div>
      <button type="submit" className="button" disabled={disabled}>
        Evaluate
      </button>
    </form>
  );
}
