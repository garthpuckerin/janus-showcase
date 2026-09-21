import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { DESK_ONLY_VIEWS } from '../../constants/surfaces.js';

const DESK_ONLY_LABELS = Object.freeze({ policies: 'Policies', boundary: 'Boundary' });

/** The companion's "More" destination: a bottom sheet dialog listing the
 *  outcome-matrix lookup, the theme/density toggles, the escape hatch to the
 *  desktop layout, and the two workstation-only surfaces (tagged, not
 *  hidden). Focus moves into the dialog on open and back to whatever opened
 *  it on close; Escape and a scrim click both close it. */
export function MoreSheet({
  open,
  onClose,
  onNavigate,
  theme,
  onThemeChange,
  density,
  onDensityChange,
  onOpenDesktop,
  onReplayIntro,
}) {
  const headingId = useId();
  const dialogRef = useRef(null);
  const lastFocusedRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    lastFocusedRef.current = document.activeElement;
    dialogRef.current?.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (lastFocusedRef.current instanceof HTMLElement) lastFocusedRef.current.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="companion-sheet__scrim" role="presentation" onClick={onClose}>
      <div
        ref={dialogRef}
        className="companion-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="companion-sheet__header">
          <h2 id={headingId}>More</h2>
          <button type="button" className="companion-sheet__close" onClick={onClose} aria-label="Close">
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="companion-sheet__body">
          <button type="button" className="companion-sheet__row" onClick={() => onNavigate('matrix')}>
            Outcome matrix
          </button>

          <div className="companion-sheet__row companion-sheet__row--control">
            <span>Theme</span>
            <div className="segmented" role="group" aria-label="Theme">
              <button type="button" aria-pressed={theme === 'light'} onClick={() => onThemeChange('light')}>
                Light
              </button>
              <button type="button" aria-pressed={theme === 'dark'} onClick={() => onThemeChange('dark')}>
                Dark
              </button>
            </div>
          </div>

          <div className="companion-sheet__row companion-sheet__row--control">
            <span>Density</span>
            <div className="segmented" role="group" aria-label="Information density">
              <button
                type="button"
                aria-pressed={density === 'comfortable'}
                onClick={() => onDensityChange('comfortable')}
              >
                Comfortable
              </button>
              <button type="button" aria-pressed={density === 'dense'} onClick={() => onDensityChange('dense')}>
                Dense
              </button>
            </div>
          </div>

          <button type="button" className="companion-sheet__row" onClick={onOpenDesktop}>
            Open the desktop layout
          </button>

          <button type="button" className="companion-sheet__row" onClick={onReplayIntro}>
            Replay the introduction
          </button>

          {DESK_ONLY_VIEWS.map((id) => (
            <button key={id} type="button" className="companion-sheet__row" onClick={() => onNavigate(id)}>
              <span>{DESK_ONLY_LABELS[id]}</span>
              <span className="chip chip--neutral">workstation</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
