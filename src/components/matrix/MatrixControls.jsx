import { PARTICIPATION, MODEL_RESULTS } from '../../domain/matrix.js';
import { MATRIX_PRESETS } from './matrixPresets.js';

/** The four axes the outcome matrix resolves on, plus the two canonical
 *  presets — each control mirrors a domain constant, never a hand-typed
 *  option list. */
export function MatrixControls({ routePresent, participation, modelResult, adviseAllowed, onChange, onPreset }) {
  return (
    <div className="panel matrix-controls">
      <div className="matrix-controls__fields">
        <div className="field">
          <label htmlFor="matrix-route">Action route</label>
          <select
            id="matrix-route"
            value={routePresent ? 'present' : 'absent'}
            onChange={(event) => onChange({ routePresent: event.target.value === 'present' })}
          >
            <option value="present">Present</option>
            <option value="absent">Absent</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="matrix-participation">Model participation</label>
          <select
            id="matrix-participation"
            value={participation}
            onChange={(event) => onChange({ participation: event.target.value })}
          >
            {PARTICIPATION.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="matrix-model-result">Model result</label>
          <select
            id="matrix-model-result"
            value={modelResult}
            onChange={(event) => onChange({ modelResult: event.target.value })}
          >
            {MODEL_RESULTS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <div className="field field--checkbox">
          <label htmlFor="matrix-advise-allowed">
            <input
              id="matrix-advise-allowed"
              type="checkbox"
              checked={adviseAllowed}
              onChange={(event) => onChange({ adviseAllowed: event.target.checked })}
            />
            ADVISE is in the persona&rsquo;s allowlist
          </label>
        </div>
      </div>
      <div className="matrix-controls__presets" role="group" aria-label="Load a canonical policy's settings">
        {MATRIX_PRESETS.map((preset) => (
          <button key={preset.key} type="button" className="button button--ghost" onClick={() => onPreset(preset)}>
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
