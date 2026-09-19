import { useCallback, useMemo, useState } from 'react';
import { isRegistryValid, resolveDirective } from '../domain/matrix.js';
import { MatrixTable } from '../components/common/MatrixTable.jsx';
import { MatrixControls } from '../components/matrix/MatrixControls.jsx';
import { MatrixResultPanel } from '../components/matrix/MatrixResultPanel.jsx';
import { invalidCombinationRule } from '../components/matrix/matrixExplorerRules.js';

const INITIAL_STATE = Object.freeze({
  routePresent: true,
  participation: 'advisory',
  modelResult: 'actionable',
  adviseAllowed: true,
});

export function MatrixView() {
  const [combo, setCombo] = useState(INITIAL_STATE);

  const handleChange = useCallback((patch) => setCombo((prev) => ({ ...prev, ...patch })), []);

  const handlePreset = useCallback((preset) => {
    setCombo((prev) => ({
      ...prev,
      routePresent: preset.routePresent,
      participation: preset.participation,
      adviseAllowed: preset.adviseAllowed,
    }));
  }, []);

  const valid = useMemo(() => isRegistryValid(combo), [combo]);
  const invalidRule = useMemo(() => (valid ? null : invalidCombinationRule(combo)), [combo, valid]);
  const resolved = useMemo(() => (valid ? resolveDirective(combo) : null), [combo, valid]);

  return (
    <section aria-labelledby="matrix-heading">
      <div className="page-header">
        <div>
          <h1 id="matrix-heading">Outcome matrix</h1>
          <p className="page-framing">
            Every registry-valid combination of route, participation, model result and whether ADVISE is allowed
            resolves to exactly one directive. Registry-invalid combinations are named, not silently resolved.
          </p>
        </div>
      </div>

      <MatrixControls
        routePresent={combo.routePresent}
        participation={combo.participation}
        modelResult={combo.modelResult}
        adviseAllowed={combo.adviseAllowed}
        onChange={handleChange}
        onPreset={handlePreset}
      />

      <div aria-live="polite">
        <MatrixResultPanel resolved={resolved} invalidRule={invalidRule} />
      </div>

      <div className="panel matrix-explorer-table">
        <MatrixTable
          firedRow={resolved?.row ?? null}
          highlightDescription="the row resolved for the current combination is marked"
        />
      </div>
    </section>
  );
}
