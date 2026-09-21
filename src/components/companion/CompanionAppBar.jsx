import { Glyph } from '../layout/Glyph.jsx';

/** Compact companion app bar (≤52px): the two-tone glyph, the current
 *  screen's title, and the standing "Mock data" notice. No menu button — the
 *  More tab owns that, and a second entry point to the same sheet is noise.
 *  The notice is not optional: the desktop topbar always shows that this is
 *  mock data over a private engine, so the phone must too. */
export function CompanionAppBar({ title }) {
  return (
    <header className="companion-appbar">
      <Glyph className="companion-appbar__glyph" />
      <span className="companion-appbar__title">{title}</span>
      <span className="chip chip--neutral companion-appbar__notice">Mock data</span>
    </header>
  );
}
