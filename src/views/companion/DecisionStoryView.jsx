import { findLedgerEntry } from '../../data/ledger.js';
import { StoryMiniHeader } from '../../components/companion/story/StoryMiniHeader.jsx';
import { StoryContent } from '../../components/companion/story/StoryContent.jsx';
import { DataState } from '../../components/common/DataState.jsx';
import ErrorBoundary from '../../components/common/ErrorBoundary.jsx';

/**
 * The companion's decision detail — the decision story (docs/DESIGN-SYSTEM.md
 * "the decision story"): a sticky mini-header, a one-line verdict, and the
 * six stages split across the two faces full-bleed. Not the desktop page
 * stacked into one column — every stage collapses to its own derived line,
 * only the stage that explains the outcome opens by default, and there are
 * no re-run controls. `StoryContent` is wrapped in its own `ErrorBoundary`
 * so a scenario that throws renders the shared danger `DataState`, never a
 * blank screen — `CompanionShell.jsx` does not wrap this route itself.
 */
export function DecisionStoryView({ scenarioId, onBack, onOpenDesktop }) {
  const entry = findLedgerEntry(scenarioId);

  return (
    <section aria-labelledby="story-heading" className="story">
      <StoryMiniHeader
        title={entry ? entry.scenario.title : 'This decision could not be found'}
        onBack={onBack}
      />

      {entry ? (
        <ErrorBoundary>
          <StoryContent entry={entry} onOpenDesktop={onOpenDesktop} />
        </ErrorBoundary>
      ) : (
        <DataState
          tone="neutral"
          title="This decision could not be found"
          action={
            <button type="button" className="button" onClick={onBack}>
              Back to decisions
            </button>
          }
        >
          The requested id does not match any entry in the ledger.
        </DataState>
      )}
    </section>
  );
}
