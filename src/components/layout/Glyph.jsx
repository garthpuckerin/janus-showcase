/** The two faces, drawn with two plain elements — no SVG logo art, no icon.
 *  Half surface-with-border (Janus's side), half panel (Fabric's side).
 *  Shared by the desktop Wordmark (`shell.css`) and the companion app bar
 *  (`companion-shell.css`); both size it with their own class on top of the
 *  `.glyph` base rules in `components.css`. */
export function Glyph({ className = '' }) {
  return (
    <span className={`glyph ${className}`.trim()} aria-hidden="true">
      <span className="glyph__half glyph__half--light" />
      <span className="glyph__half glyph__half--dark" />
    </span>
  );
}
