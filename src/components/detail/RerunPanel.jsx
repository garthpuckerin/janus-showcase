import { useCallback, useState } from 'react';
import { CALLER_IDS } from '../../data/callers.js';
import { PORT_PRESETS } from './portPresets.js';

export function RerunPanel({ defaultCallerId, defaultPortKey, onRun, onReset }) {
  const [callerId, setCallerId] = useState(defaultCallerId);
  const [portKey, setPortKey] = useState(defaultPortKey);

  const handleCallerChange = useCallback(
    (event) => {
      const next = event.target.value;
      setCallerId(next);
      onRun({ callerId: next, portKey });
    },
    [onRun, portKey],
  );

  const handlePortChange = useCallback(
    (event) => {
      const next = event.target.value;
      setPortKey(next);
      onRun({ callerId, portKey: next });
    },
    [onRun, callerId],
  );

  const handleReset = useCallback(() => {
    setCallerId(defaultCallerId);
    setPortKey(defaultPortKey);
    onReset();
  }, [defaultCallerId, defaultPortKey, onReset]);

  return (
    <div className="card rerun-panel">
      <div className="card__header">
        <span className="eyebrow">Re-run this request</span>
      </div>
      <div className="rerun-panel__body">
        <div className="rerun-panel__fields">
          <div className="field">
            <label htmlFor="rerun-caller">Trusted caller</label>
            <select id="rerun-caller" value={callerId} onChange={handleCallerChange}>
              {CALLER_IDS.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="rerun-port">Model port result</label>
            <select id="rerun-port" value={portKey} onChange={handlePortChange}>
              {Object.entries(PORT_PRESETS).map(([key, preset]) => (
                <option key={key} value={key}>
                  {preset.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {/* Nothing to reset until a field differs from the recorded request —
            an enabled button that does nothing is a dead control. */}
        <button
          type="button"
          className="button button--secondary"
          onClick={handleReset}
          disabled={callerId === defaultCallerId && portKey === defaultPortKey}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
