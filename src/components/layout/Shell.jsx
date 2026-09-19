import { Sidebar } from './Sidebar.jsx';
import { TopBar } from './TopBar.jsx';

export function Shell({ navItems, activeView, onNavigate, children }) {
  return (
    <div className="app-shell">
      <Sidebar navItems={navItems} activeView={activeView} onNavigate={onNavigate} />
      <TopBar />
      <main className="app-main" id="main-content">
        <div className="app-main__inner">{children}</div>
      </main>
    </div>
  );
}
