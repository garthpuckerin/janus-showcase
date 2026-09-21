import { ADVISOR_POLICY } from '../../advisor/advisorFlow.js';
import { fieldMeta } from '../../advisor/advisorFieldMeta.js';
import { ADVISOR_PORT_PRESETS } from '../../advisor/advisorPresets.js';
import { WizardField } from './WizardField.jsx';
import { whyCannotAct } from './whyCannotAct.js';

/* The Ask step's fields are exactly the policy's own allowlist, filtered to
   the fields meant to be asked up front — the same derivation the desktop
   Ask form uses, never a second hand-kept list. */
const ASK_FIELDS = ADVISOR_POLICY.input_allowlist.filter((field) => fieldMeta(field).stage === 'ask');

export function WizardAskStep({ formId, values, onFieldChange, portKey, onPortKeyChange, onSubmit }) {
  const facts = whyCannotAct(ADVISOR_POLICY);

  return (
    <div className="advisor-wizard__screen">
      <h2 className="advisor-wizard__heading">Ask</h2>
      <form
        id={formId}
        className="wizard-form"
        aria-label="Ask the advisor persona"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        {ASK_FIELDS.map((field) => (
          <WizardField
            key={field}
            name={field}
            meta={fieldMeta(field)}
            value={values[field] ?? ''}
            onChange={onFieldChange}
            idPrefix="wizard-ask"
          />
        ))}
        <div className="field">
          <label htmlFor="wizard-ask-port">Model port result (scripted)</label>
          <select id="wizard-ask-port" value={portKey} onChange={(event) => onPortKeyChange(event.target.value)}>
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
        <summary>Why this persona cannot act</summary>
        <dl className="wizard-kv">
          <dt>Action routes</dt>
          <dd className="mono">{facts.actionRouteCount}</dd>
          <dt>ACTIVATE_SHARD in its directive allowlist</dt>
          <dd className="mono">{facts.canActivateShard ? 'Yes' : 'No'}</dd>
          <dt>Model participation</dt>
          <dd className="mono">{facts.modelParticipation}</dd>
          <dt>Minimum model confidence</dt>
          <dd className="mono tabular-num">{facts.minimumModelConfidence}</dd>
        </dl>
        <p className="page-framing">
          With {facts.actionRouteCount} action routes and no <code>ACTIVATE_SHARD</code> in its allowlist, this
          persona can only ever produce advice or ask for more input.
        </p>
      </details>
    </div>
  );
}
