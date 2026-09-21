const DENSITY_OPTIONS = [
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'dense', label: 'Dense' },
];

const THEME_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

/** Page eyebrow + title left; the "Mock data" tag, a density toggle and a
 *  theme toggle right. Both toggles are real buttons with `aria-pressed`,
 *  labelled in text. */
export function TopBar({ eyebrow, title, density, onDensityChange, theme, onThemeChange }) {
  return (
    <header className="app-topbar">
      <div className="app-topbar__heading">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        {title && <span className="app-topbar__title">{title}</span>}
      </div>
      <div className="app-topbar__actions">
        <span className="chip chip--neutral" role="status">
          Mock data · engine is private
        </span>
        <div className="segmented" role="group" aria-label="Information density">
          {DENSITY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={density === option.value}
              onClick={() => onDensityChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Theme">
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={theme === option.value}
              onClick={() => onThemeChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
