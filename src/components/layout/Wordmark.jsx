import { Glyph } from './Glyph.jsx';

/** Janus in sans 700 beside the two-tone glyph (see `Glyph.jsx`) — the two
 *  faces, drawn with two rectangles. No other logo. */
export function Wordmark({ className = '' }) {
  return (
    <div className={`wordmark ${className}`.trim()}>
      <Glyph className="wordmark__glyph" />
      <span className="wordmark__text">
        <span className="wordmark__name">Janus</span>
        <span className="wordmark__sub">decision engine</span>
      </span>
    </div>
  );
}
