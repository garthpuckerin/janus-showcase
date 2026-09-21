import { useCallback, useMemo, useState } from 'react';
import { LEDGER } from '../../data/ledger.js';
import { anchorNow } from '../../data/anchor.js';
import { DecisionCard } from '../../components/companion/DecisionCard.jsx';
import { DataState } from '../../components/common/DataState.jsx';

const DIRECTIVE_FILTERS = Object.freeze([
  { id: 'all', label: 'All' },
  { id: 'ACTIVATE_SHARD', label: 'Activate shard' },
  { id: 'ADVISE', label: 'Advise' },
  { id: 'REQUEST_INPUT', label: 'Request input' },
]);

/** The companion's decisions feed: cards, never a table, newest first. The
 *  directive filter is a single native `<select>` with counts derived from
 *  the ledger, never a scrolling pill strip. */
export function DecisionsFeedView({ onOpenDecision }) {
  const now = useMemo(() => anchorNow(), []);
  const [filter, setFilter] = useState('all');

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
    () => (filter === 'all' ? rows : rows.filter((entry) => entry.evaluation.directive.type === filter)),
    [rows, filter],
  );

  const handleFilterChange = useCallback((event) => setFilter(event.target.value), []);

  return (
    <section aria-labelledby="decisions-feed-heading" className="decisions-feed">
      <h1 id="decisions-feed-heading" className="visually-hidden">
        Decisions
      </h1>

      <label className="field decisions-feed__filter">
        <span>Directive</span>
        <select value={filter} onChange={handleFilterChange}>
          {DIRECTIVE_FILTERS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label} ({counts[option.id]})
            </option>
          ))}
        </select>
      </label>

      {filteredRows.length === 0 ? (
        <DataState tone="neutral">No decisions match this filter.</DataState>
      ) : (
        <ul className="decisions-feed__list">
          {filteredRows.map((entry) => (
            <DecisionCard key={entry.scenario.id} entry={entry} now={now} onOpen={onOpenDecision} />
          ))}
        </ul>
      )}
    </section>
  );
}
