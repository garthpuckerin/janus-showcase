/** One form control, rendered from a field name plus its render metadata —
 *  shared by the Ask and Clarify steps so a field's shape is defined once. */
export function AdvisorField({ name, meta, value, onChange, idPrefix }) {
  const id = `${idPrefix}-${name}`;
  const handleChange = (event) => onChange(name, event.target.value);

  return (
    <div className="field advisor-field">
      <label htmlFor={id}>
        {meta.label}
        {meta.required && <span aria-hidden="true"> *</span>}
        {meta.required && <span className="visually-hidden"> (required)</span>}
      </label>
      {meta.control === 'textarea' && (
        <textarea id={id} rows={3} value={value} required={meta.required} onChange={handleChange} />
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
      {meta.control === 'number' && (
        <input id={id} type="number" value={value} onChange={handleChange} />
      )}
      {meta.control === 'text' && (
        <input id={id} type="text" value={value} required={meta.required} onChange={handleChange} />
      )}
      {meta.helpText && <p className="advisor-field__help">{meta.helpText}</p>}
    </div>
  );
}
