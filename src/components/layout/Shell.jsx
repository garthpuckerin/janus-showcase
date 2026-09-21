import { Sidebar } from './Sidebar.jsx';
import { TopBar } from './TopBar.jsx';
import { useTheme } from '../../hooks/useTheme.js';
import { useDensity } from '../../hooks/useDensity.js';

export function Shell({ navGroups, activeView, onNavigate, pageEyebrow, pageTitle, children }) {
  const [theme, setTheme] = useTheme();
  const [density, setDensity] = useDensity();

  return (
    <div className="app-shell">
      <Sidebar navGroups={navGroups} activeView={activeView} onNavigate={onNavigate} />
      <TopBar
        eyebrow={pageEyebrow}
        title={pageTitle}
        density={density}
        onDensityChange={setDensity}
        theme={theme}
        onThemeChange={setTheme}
      />
      <main className="app-main" id="main-content">
        <div className="app-main__inner">{children}</div>
      </main>
    </div>
  );
}
