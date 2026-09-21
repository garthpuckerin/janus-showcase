import { useCallback, useMemo, useState } from 'react';
import { MATRIX_ROWS } from '../../domain/matrix.js';
import { orderRowsForCards } from '../../components/common/matrixTableRows.js';
import { resolveLookup } from '../../components/companion/matrix/matrixLookup.js';
import { MatrixLookupControls } from '../../components/companion/matrix/MatrixLookupControls.jsx';
import { MatrixLookupResult } from '../../components/companion/matrix/MatrixLookupResult.jsx';
import { MatrixRowCard } from '../../components/companion/matrix/MatrixRowCard.jsx';

const INITIAL_STATE = Object.freeze({
  routePresent: true,
  participation: 'advisory',
  modelResult: 'actionable',
  adviseAllowed: true,
});

/**
 * The phone Outcome matrix as a LOOKUP, not a table: three native selects
 * and a checkbox resolve to one result card; every row is still available,
 * behind "All rows", as cards — the fired one first. Built on the same
 * domain functions (`resolveDirective`, `isRegistryValid`) and the same
 * pure row-orderer the desktop explorer and the decision rail use.
 */
export function MatrixLookupView() {
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

  const lookup = useMemo(() => resolveLookup(combo), [combo]);
  const firedRow = lookup.valid ? lookup.resolved.row : null;
  const orderedRows = useMemo(() => orderRowsForCards(firedRow), [firedRow]);

  return (
    <section aria-labelledby="matrix-lookup-heading" className="matrix-lookup">
      <h1 id="matrix-lookup-heading" className="visually-hidden">Outcome matrix</h1>

      {/* The answer is the point of a lookup: it is FIRST and it stays docked
          under the app bar while the inputs below it change. (It used to sit
          under the controls, cut off at the bottom of the first screen.) */}
      <div aria-live="polite" className="matrix-lookup__dock">
        <MatrixLookupResult lookup={lookup} />
      </div>

      <MatrixLookupControls
        routePresent={combo.routePresent}
        participation={combo.participation}
        modelResult={combo.modelResult}
        adviseAllowed={combo.adviseAllowed}
        onChange={handleChange}
        onPreset={handlePreset}
      />

      <details className="matrix-lookup__all-rows">
        <summary>All rows</summary>
        <ul className="matrix-lookup__row-list">
          {orderedRows.map((row) => (
            <MatrixRowCard key={row.row} row={row} fired={row.row === firedRow} />
          ))}
        </ul>
        <p className="visually-hidden">All {MATRIX_ROWS.length} outcome-matrix rows; the fired row is listed first.</p>
      </details>
    </section>
  );
}
