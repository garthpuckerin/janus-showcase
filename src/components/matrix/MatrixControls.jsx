import { PARTICIPATION, MODEL_RESULTS } from '../../domain/matrix.js';
import { MATRIX_PRESETS } from './matrixPresets.js';

/** One labelled `.segmented` group of buttons — a route, a participation
 *  level or a model result — mirroring a domain constant, never a
 *  hand-typed option list. */
function SegmentedGroup({ label, options, value, onChange }) {
  const labelId = `matrix-${label.replace(/\s+/g, '-').toLowerCase()}-label`;
  return (
    <div className="field">
      <span id={labelId}>{label}</span>
      <div className="segmented matrix-controls__segmented" role="group" aria-labelledby={labelId}>
        {options.map((option) => (
          <button key={option} type="button" aria-pressed={value === option} onClick={() => onChange(option)}>
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

/** The four axes the outcome matrix resolves on, plus the two canonical
 *  presets. */
export function MatrixControls({ routePresent, participation, modelResult, adviseAllowed, onChange, onPreset }) {
  return (
    <div className="card matrix-controls">
      <div className="matrix-controls__fields">
        <SegmentedGroup
          label="Action route"
          options={['present', 'absent']}
          value={routePresent ? 'present' : 'absent'}
          onChange={(value) => onChange({ routePresent: value === 'present' })}
        />
        <SegmentedGroup
          label="Model participation"
          options={PARTICIPATION}
          value={participation}
          onChange={(value) => onChange({ participation: value })}
        />
        <SegmentedGroup
          label="Model result"
          options={MODEL_RESULTS}
          value={modelResult}
          onChange={(value) => onChange({ modelResult: value })}
        />
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
          <button key={preset.key} type="button" className="button button--secondary" onClick={() => onPreset(preset)}>
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
