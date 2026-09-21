import { useCallback, useMemo } from 'react';
import { Shell } from './components/layout/Shell.jsx';
import { CompanionShell } from './components/companion/CompanionShell.jsx';
import { DecisionsView } from './views/DecisionsView.jsx';
import { DecisionDetailView } from './views/DecisionDetailView.jsx';
import { AdvisorView } from './views/AdvisorView.jsx';
import { MatrixView } from './views/MatrixView.jsx';
import { PoliciesView } from './views/PoliciesView.jsx';
import { BoundaryView } from './views/BoundaryView.jsx';
import ErrorBoundary from './components/common/ErrorBoundary.jsx';
import { useQueryParamState } from './hooks/useQueryParamState.js';
import { useWorkstation } from './hooks/useWorkstation.js';
import { resolveRoute } from './utils/surface.js';
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
  const workstation = useWorkstation();
  // The two shells default to different home screens (Decisions vs.
  // Attention), so the fallback passed to the query-param hook depends on
  // which one is rendering. `resolveRoute` then strips out the literal
  // `desktop` layout switch, which the hook would otherwise hand back as if
  // it were a route.
  const [rawView, setView] = useQueryParamState('view', workstation.isWorkstation ? 'decisions' : 'attention');
  const [selectedId, setSelectedId] = useQueryParamState('d', null);
  const view = resolveRoute({ rawView, fallback: workstation.isWorkstation ? 'decisions' : 'attention' });

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
  const handleOpenDecision = useCallback(
    (scenarioId) => {
      setView('decisions');
      setSelectedId(scenarioId);
    },
    [setView, setSelectedId],
  );

  if (!workstation.isWorkstation) {
    return (
      <CompanionShell
        view={view}
        selectedId={selectedId}
        onNavigate={handleNavigate}
        onOpenDecision={handleOpenDecision}
        onCloseDecision={handleCloseDetail}
        onForceDesktop={workstation.forceDesktop}
      />
    );
  }

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
      showBackToPhone={workstation.forcedOnNarrowViewport}
      onBackToPhone={workstation.clearForceDesktop}
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
