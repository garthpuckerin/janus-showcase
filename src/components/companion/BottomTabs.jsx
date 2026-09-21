import { AlertCircle, ListChecks, Compass, Menu } from 'lucide-react';
import { COMPANION_TABS } from '../../constants/surfaces.js';

const TAB_META = Object.freeze({
  attention: { label: 'Attention', icon: AlertCircle },
  decisions: { label: 'Decisions', icon: ListChecks },
  advisor: { label: 'Advisor', icon: Compass },
  more: { label: 'More', icon: Menu },
});

/** The companion's primary nav: fixed to the viewport bottom, safe-area
 *  padded, one real `<button>` per tab with an icon and a text label. The
 *  active tab carries `aria-current="page"` — colour is never the only
 *  signal. "More" opens the sheet instead of navigating. */
export function BottomTabs({ activeTab, onNavigate, onMore }) {
  return (
    <nav className="companion-tabs" aria-label="Primary">
      {COMPANION_TABS.map((id) => {
        const { label, icon: Icon } = TAB_META[id];
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            type="button"
            className="companion-tabs__tab"
            aria-current={isActive ? 'page' : undefined}
            onClick={() => (id === 'more' ? onMore() : onNavigate(id))}
          >
            <Icon size={20} aria-hidden="true" />
            <span className="companion-tabs__label">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
