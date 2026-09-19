import { useCallback, useMemo } from 'react';
import { Shell } from './components/layout/Shell.jsx';
import { DecisionsView } from './views/DecisionsView.jsx';
import { DecisionDetailView } from './views/DecisionDetailView.jsx';
import { AdvisorView } from './views/AdvisorView.jsx';
import { MatrixView } from './views/MatrixView.jsx';
import { PoliciesView } from './views/PoliciesView.jsx';
import { BoundaryView } from './views/BoundaryView.jsx';
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
  } else if (view === 'advisor') {
    content = (
      <ErrorBoundary>
        <AdvisorView />
      </ErrorBoundary>
    );
  } else if (view === 'matrix') {
    content = (
      <ErrorBoundary>
        <MatrixView />
      </ErrorBoundary>
    );
  } else if (view === 'policies') {
    content = (
      <ErrorBoundary>
        <PoliciesView />
      </ErrorBoundary>
    );
  } else if (view === 'boundary') {
    content = (
      <ErrorBoundary>
        <BoundaryView />
      </ErrorBoundary>
    );
  } else {
    content = <DecisionsView onSelectScenario={handleSelectScenario} />;
  }

  return (
    <Shell navItems={NAV_ITEMS} activeView={view} onNavigate={handleNavigate}>
      {content}
    </Shell>
  );
}
