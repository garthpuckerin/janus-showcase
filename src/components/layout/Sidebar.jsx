
export function Sidebar({ navItems, activeView, onNavigate }) {
  return (
    <nav className="app-sidebar" aria-label="Primary">
      <div className="app-sidebar__nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`nav-link${activeView === item.id ? ' nav-link--active' : ''}`}
            aria-current={activeView === item.id ? 'page' : undefined}
            onClick={() => onNavigate(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
