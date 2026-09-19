import { useCallback, useMemo, useState } from 'react';
import { LEDGER } from '../data/ledger.js';
import { anchorNow } from '../data/anchor.js';
import { EmptyState } from '../components/common/EmptyState.jsx';
import { Skeleton } from '../components/common/Skeleton.jsx';
import { FilterChip } from '../components/decisions/FilterChip.jsx';
import { DecisionsTable } from '../components/decisions/DecisionsTable.jsx';
import { usePageReady } from '../hooks/usePageReady.js';

const DIRECTIVE_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'ACTIVATE_SHARD', label: 'Activate shard' },
  { id: 'ADVISE', label: 'Advise' },
  { id: 'REQUEST_INPUT', label: 'Request input' },
];

export function DecisionsView({ onSelectScenario }) {
  const ready = usePageReady();
  const now = useMemo(() => anchorNow(), []);
  const [activeFilter, setActiveFilter] = useState('all');

  const rows = useMemo(
    () => [...LEDGER].sort((a, b) => new Date(b.scenario.occurredAt) - new Date(a.scenario.occurredAt)),
    [],
  );

  const counts = useMemo(() => {
    const base = { all: rows.length, ACTIVATE_SHARD: 0, ADVISE: 0, REQUEST_INPUT: 0 };
    for (const entry of rows) base[entry.evaluation.directive.type] += 1;
    return base;
  }, [rows]);

  const filteredRows = useMemo(
    () => (activeFilter === 'all' ? rows : rows.filter((entry) => entry.evaluation.directive.type === activeFilter)),
    [rows, activeFilter],
  );

  const handleFilter = useCallback((filterId) => setActiveFilter(filterId), []);

  return (
    <section aria-labelledby="decisions-heading">
      <div className="page-header">
        <div>
          <h1 id="decisions-heading">Decisions</h1>
          <p className="page-framing">
            This history belongs to the composed runtime that receives each directive — Fabric outcomes, kept here
            for illustration. The decision engine itself stores nothing.
          </p>
        </div>
      </div>

      <div className="filter-chips" role="group" aria-label="Filter by directive type">
        {DIRECTIVE_FILTERS.map((filter) => (
          <FilterChip
            key={filter.id}
            label={filter.label}
            count={counts[filter.id]}
            active={activeFilter === filter.id}
            onClick={() => handleFilter(filter.id)}
          />
        ))}
      </div>

      {!ready ? (
        <Skeleton height={320} />
      ) : filteredRows.length === 0 ? (
        <EmptyState message="No decisions match this filter." />
      ) : (
        <DecisionsTable rows={filteredRows} now={now} onSelectScenario={onSelectScenario} />
      )}
    </section>
  );
}
