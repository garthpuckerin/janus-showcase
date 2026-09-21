import { useMemo } from 'react';
import { LEDGER } from '../../data/ledger.js';
import { anchorNow } from '../../data/anchor.js';
import { groupAttention } from '../../utils/attention.js';
import { AttentionCard } from '../../components/companion/AttentionCard.jsx';
import { DataState } from '../../components/common/DataState.jsx';

/** The phone-only home tab: what needs a human, grouped by why, newest
 *  first within each group. The grouping is `groupAttention()`
 *  (unit-tested) over the same ledger the desktop Decisions view reads. */
export function AttentionView({ onOpenDecision }) {
  const now = useMemo(() => anchorNow(), []);
  const { total, needing, groups } = useMemo(() => groupAttention(LEDGER), []);

  return (
    <section aria-labelledby="attention-heading" className="attention-view">
      <h1 id="attention-heading" className="attention-view__heading">
        {needing} of {total} need attention
      </h1>

      {needing === 0 ? (
        <DataState tone="accent" title="Nothing needs attention">
          Every request in this ledger already activated, advised, or was resolved.
        </DataState>
      ) : (
        groups.map((group) => (
          <section
            key={group.id}
            aria-labelledby={`attention-group-${group.id}`}
            className="attention-group"
            data-group={group.id}
          >
            <h2 id={`attention-group-${group.id}`} className="attention-group__title">
              {group.title}
            </h2>
            <ul className="attention-group__list">
              {group.items.map(({ entry, reason }) => (
                <AttentionCard key={entry.scenario.id} entry={entry} reason={reason} now={now} onOpen={onOpenDecision} />
              ))}
            </ul>
          </section>
        ))
      )}
    </section>
  );
}
