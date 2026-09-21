import { Wordmark } from './Wordmark.jsx';

/** Grouped primary nav: mono uppercase group labels, `aria-current="page"`
 *  on the active item, a 3px accent-line bar on the active item's left edge
 *  (drawn in CSS via `.nav-link--active`). */
export function Sidebar({ navGroups, activeView, onNavigate }) {
  return (
    <nav className="app-sidebar" aria-label="Primary">
      <Wordmark />
      <div className="app-sidebar__nav">
        {navGroups.map((group) => (
          <div className="nav-group" key={group.id}>
            <h2 className="nav-group__label">{group.label}</h2>
            {group.items.map((item) => (
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
        ))}
      </div>
    </nav>
  );
}
