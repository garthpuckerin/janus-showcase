import { useCallback, useMemo, useState } from 'react';
import { isRegistryValid, resolveDirective } from '../domain/matrix.js';
import { MatrixTable } from '../components/common/MatrixTable.jsx';
import { MatrixControls } from '../components/matrix/MatrixControls.jsx';
import { MatrixResultPanel } from '../components/matrix/MatrixResultPanel.jsx';
import { DataState } from '../components/common/DataState.jsx';
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
      <div className="page-heading">
        <div>
          <span className="eyebrow">Understand</span>
          <h1 id="matrix-heading" className="page-heading__title">Outcome matrix</h1>
          <p className="page-heading__lede">
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
        {resolved || invalidRule ? (
          <MatrixResultPanel resolved={resolved} invalidRule={invalidRule} />
        ) : (
          <DataState tone="neutral">Choose a combination above to resolve a directive.</DataState>
        )}
      </div>

      <div className="card matrix-explorer-table">
        <MatrixTable
          density="full"
          firedRow={resolved?.row ?? null}
          highlightDescription="the row resolved for the current combination is marked"
        />
      </div>
    </section>
  );
}
