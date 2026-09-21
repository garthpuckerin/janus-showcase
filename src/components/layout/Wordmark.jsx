/** The two faces, drawn with two plain elements — no SVG logo art, no icon.
 *  Half surface-with-border (Janus's side), half panel (Fabric's side). */
export function Wordmark({ className = '' }) {
  return (
    <div className={`wordmark ${className}`.trim()}>
      <span className="wordmark__glyph" aria-hidden="true">
        <span className="wordmark__glyph-half wordmark__glyph-half--light" />
        <span className="wordmark__glyph-half wordmark__glyph-half--dark" />
      </span>
      <span className="wordmark__text">
        <span className="wordmark__name">Janus</span>
        <span className="wordmark__sub">decision engine</span>
      </span>
    </div>
  );
}
