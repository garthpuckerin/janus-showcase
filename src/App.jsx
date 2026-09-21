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

const NAV_GROUPS = [
  {
    id: 'decide',
    label: 'Decide',
    items: [
      { id: 'decisions', label: 'Decisions' },
      { id: 'advisor', label: 'Advisor' },
    ],
  },
  {
    id: 'understand',
    label: 'Understand',
    items: [
      { id: 'matrix', label: 'Outcome matrix' },
      { id: 'policies', label: 'Policies' },
      { id: 'boundary', label: 'Boundary' },
    ],
  },
];

function activeNavItem(view) {
  for (const group of NAV_GROUPS) {
    const item = group.items.find((candidate) => candidate.id === view);
    if (item) return { group, item };
  }
  return null;
}

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

  const active = activeNavItem(view);
  const pageEyebrow = active?.group.label ?? null;
  const pageTitle = active?.item.label ?? null;

  let content;
  if (view === 'decisions' && selectedId) {
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
    <Shell
      navGroups={NAV_GROUPS}
      activeView={view}
      onNavigate={handleNavigate}
      pageEyebrow={pageEyebrow}
      pageTitle={pageTitle}
    >
      {content}
    </Shell>
  );
}
