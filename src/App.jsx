import { useCallback, useMemo } from 'react';
import { Shell } from './components/layout/Shell.jsx';
import { DecisionsView } from './views/DecisionsView.jsx';
import { DecisionDetailView } from './views/DecisionDetailView.jsx';
import { PlaceholderView } from './views/PlaceholderView.jsx';
import ErrorBoundary from './components/common/ErrorBoundary.jsx';
import { useQueryParamState } from './hooks/useQueryParamState.js';
import { LEDGER } from './data/ledger.js';

const NAV_ITEMS = [
  { id: 'decisions', label: 'Decisions' },
  { id: 'advisor', label: 'Advisor' },
  { id: 'matrix', label: 'Outcome matrix' },
  { id: 'policies', label: 'Policies' },
  { id: 'boundary', label: 'Boundary' },
];

const PLACEHOLDER_COPY = {
  advisor: 'The actionless advisor workflow — prompts, continuations and the tamper toggle.',
  matrix: 'The interactive outcome matrix explorer.',
  policies: 'Persona and action policy records, registry validation, and version diffs.',
  boundary: 'The ownership map: what Janus owns, and what it refuses to.',
};

export default function App() {
  const [view, setView] = useQueryParamState('view', 'decisions');
  const [selectedId, setSelectedId] = useQueryParamState('d', null);

  const selectedEntry = useMemo(
    () => LEDGER.find((entry) => entry.scenario.id === selectedId) ?? null,
    [selectedId],
  );

  const handleSelectScenario = useCallback((scenarioId) => setSelectedId(scenarioId), [setSelectedId]);
  const handleCloseDetail = useCallback(() => setSelectedId(null), [setSelectedId]);
  const handleNavigate = useCallback(
    (nextView) => {
      setView(nextView);
      setSelectedId(null);
    },
    [setView, setSelectedId],
  );

  let content;
  if (view === 'decisions' && selectedEntry) {
    content = (
      <ErrorBoundary>
        <DecisionDetailView entry={selectedEntry} onBack={handleCloseDetail} />
      </ErrorBoundary>
    );
  } else if (view === 'decisions') {
    content = <DecisionsView onSelectScenario={handleSelectScenario} />;
  } else {
    const activeNav = NAV_ITEMS.find((item) => item.id === view);
    content = <PlaceholderView title={activeNav?.label ?? view} description={PLACEHOLDER_COPY[view]} />;
  }

  return (
    <Shell navItems={NAV_ITEMS} activeView={view} onNavigate={handleNavigate}>
      {content}
    </Shell>
  );
}
