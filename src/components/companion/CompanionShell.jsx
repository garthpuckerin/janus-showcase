import { useState } from 'react';
import { CompanionAppBar } from './CompanionAppBar.jsx';
import { BottomTabs } from './BottomTabs.jsx';
import { MoreSheet } from './MoreSheet.jsx';
import { DeskOnlyState } from './DeskOnlyState.jsx';
import { COMPANION_TABS, DESK_ONLY_VIEWS } from '../../constants/surfaces.js';
import { AttentionView } from '../../views/companion/AttentionView.jsx';
import { DecisionsFeedView } from '../../views/companion/DecisionsFeedView.jsx';
import { DecisionStoryView } from '../../views/companion/DecisionStoryView.jsx';
import { AdvisorView } from '../../views/AdvisorView.jsx';
import { MatrixView } from '../../views/MatrixView.jsx';
import ErrorBoundary from '../common/ErrorBoundary.jsx';
import { useTheme } from '../../hooks/useTheme.js';
import { useDensity } from '../../hooks/useDensity.js';

const SCREEN_TITLES = Object.freeze({
  attention: 'Attention',
  decisions: 'Decisions',
  advisor: 'Advisor',
  matrix: 'Outcome matrix',
  policies: 'Policies',
  boundary: 'Boundary',
});

function screenTitle(view, hasOpenDecision) {
  if (hasOpenDecision) return 'Decision';
  return SCREEN_TITLES[view] ?? 'Janus';
}

function activeTabFor(view) {
  if (COMPANION_TABS.includes(view)) return view;
  if (view === 'matrix' || DESK_ONLY_VIEWS.includes(view)) return 'more';
  return 'attention';
}

/**
 * The phone/tablet companion: a compact app bar, scrolling content (the
 * document is the only scroller — see `tests/scrollContainer.test.js`), and
 * a fixed bottom tab bar. Desktop's `Sidebar`/`TopBar` are never imported
 * here, let alone mounted.
 */
export function CompanionShell({ view, selectedId, onNavigate, onOpenDecision, onCloseDecision, onForceDesktop }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [theme, setTheme] = useTheme();
  const [density, setDensity] = useDensity();

  const hasOpenDecision = view === 'decisions' && Boolean(selectedId);

  let content;
  if (DESK_ONLY_VIEWS.includes(view)) {
    content = (
      <DeskOnlyState view={view} onOpenDesktop={onForceDesktop} onBackToAttention={() => onNavigate('attention')} />
    );
  } else if (hasOpenDecision) {
    content = <DecisionStoryView scenarioId={selectedId} onBack={onCloseDecision} />;
  } else if (view === 'decisions') {
    content = <DecisionsFeedView onOpenDecision={onOpenDecision} />;
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
  } else {
    content = <AttentionView onOpenDecision={onOpenDecision} />;
  }

  const handleMoreNavigate = (nextView) => {
    onNavigate(nextView);
    setMoreOpen(false);
  };

  return (
    <div className="companion-shell">
      <CompanionAppBar title={screenTitle(view, hasOpenDecision)} onMore={() => setMoreOpen(true)} />

      <div className="companion-shell__content">{content}</div>

      <BottomTabs activeTab={activeTabFor(view)} onNavigate={onNavigate} onMore={() => setMoreOpen(true)} />

      <MoreSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        onNavigate={handleMoreNavigate}
        theme={theme}
        onThemeChange={setTheme}
        density={density}
        onDensityChange={setDensity}
        onOpenDesktop={onForceDesktop}
      />
    </div>
  );
}
