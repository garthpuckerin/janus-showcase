import { ArrowLeft } from 'lucide-react';
import { findLedgerEntry } from '../../data/ledger.js';
import { DirectiveChip } from '../../components/common/DirectiveChip.jsx';
import { DataState } from '../../components/common/DataState.jsx';

/**
 * The companion's decision detail — for now, an honest placeholder. A
 * sticky mini-header keeps the title and directive chip in view; the real
 * vertical stepper (the two faces full-bleed, stages collapsed to one
 * derived line each) is a follow-up build. No re-run controls on a phone.
 */
export function DecisionStoryView({ scenarioId, onBack }) {
  const entry = findLedgerEntry(scenarioId);

  return (
    <section aria-labelledby="decision-story-heading" className="decision-story">
      <header className="decision-story__header">
        <button type="button" className="decision-story__back" onClick={onBack} aria-label="Back to decisions">
          <ArrowLeft size={18} aria-hidden="true" />
        </button>
        <span id="decision-story-heading" className="decision-story__title">
          {entry ? entry.scenario.title : 'This decision could not be found'}
        </span>
        {entry && <DirectiveChip type={entry.evaluation.directive.type} />}
      </header>

      <DataState tone="neutral" title="The decision story is being built">
        A full step-by-step walk of this decision — the two faces full-bleed, one derived line per stage — is coming
        to the phone companion next. Open the desktop layout to see the complete rail today.
      </DataState>
    </section>
  );
}
