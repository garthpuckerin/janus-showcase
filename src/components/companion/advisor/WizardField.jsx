/** One phone form control, rendered from a field name plus the render
 *  metadata `advisorFieldMeta.js` already publishes — the wizard's own
 *  version of the desktop's `AdvisorField`, sharing the metadata module, not
 *  the component, per the build brief (separate phone components, same
 *  logic). */
export function WizardField({ name, meta, value, onChange, idPrefix }) {
  const id = `${idPrefix}-${name}`;
  const handleChange = (event) => onChange(name, event.target.value);

  return (
    <div className="field">
      <label htmlFor={id}>
        {meta.label}
        {meta.required && <span aria-hidden="true"> *</span>}
        {meta.required && <span className="visually-hidden"> (required)</span>}
      </label>
      {meta.control === 'textarea' && (
        <textarea id={id} rows={4} value={value} required={meta.required} onChange={handleChange} />
      )}
      {meta.control === 'select' && (
        <select id={id} value={value} onChange={handleChange}>
          {meta.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
      {meta.control === 'number' && <input id={id} type="number" value={value} onChange={handleChange} />}
      {meta.control === 'text' && (
        <input id={id} type="text" value={value} required={meta.required} onChange={handleChange} />
      )}
      {meta.helpText && <p className="wizard-field__help">{meta.helpText}</p>}
    </div>
  );
}
