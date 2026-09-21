import { PARTICIPATION, MODEL_RESULTS } from '../../../domain/matrix.js';
import { MATRIX_PRESETS } from '../../matrix/matrixPresets.js';

/** The lookup's four axes as native controls, stacked — never the desktop's
 *  segmented-button groups, which are mouse-sized and mean choosing among
 *  few options is a row of small buttons rather than one native picker. */
export function MatrixLookupControls({ routePresent, participation, modelResult, adviseAllowed, onChange, onPreset }) {
  return (
    <div className="matrix-lookup__controls">
      <div className="field">
        <label htmlFor="matrix-lookup-route">Action route</label>
        <select
          id="matrix-lookup-route"
          value={routePresent ? 'present' : 'absent'}
          onChange={(event) => onChange({ routePresent: event.target.value === 'present' })}
        >
          <option value="present">Present</option>
          <option value="absent">Absent</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="matrix-lookup-participation">Model participation</label>
        <select
          id="matrix-lookup-participation"
          value={participation}
          onChange={(event) => onChange({ participation: event.target.value })}
        >
          {PARTICIPATION.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="matrix-lookup-model-result">Model result</label>
        <select
          id="matrix-lookup-model-result"
          value={modelResult}
          onChange={(event) => onChange({ modelResult: event.target.value })}
        >
          {MODEL_RESULTS.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>

      <label className="matrix-lookup__checkbox">
        <input
          type="checkbox"
          checked={adviseAllowed}
          onChange={(event) => onChange({ adviseAllowed: event.target.checked })}
        />
        ADVISE is in the persona&rsquo;s allowlist
      </label>

      <div className="matrix-lookup__presets" role="group" aria-labelledby="matrix-presets-label">
        <span id="matrix-presets-label" className="matrix-lookup__presets-label">
          Load a canonical policy&rsquo;s settings
        </span>
        {MATRIX_PRESETS.map((preset) => (
          <button key={preset.key} type="button" className="button button--secondary" onClick={() => onPreset(preset)}>
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
