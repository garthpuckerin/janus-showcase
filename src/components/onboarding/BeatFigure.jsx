import { DirectiveChip } from '../common/DirectiveChip.jsx';

/** The one small derived figure per beat (`beats.js`) — never a decorative
 *  illustration, always a rendition of a real value off the anchor scenario
 *  or the domain's own directive vocabulary. Shared by the desktop dialog
 *  and the phone steps. */
export function BeatFigure({ figure }) {
  if (figure.kind === 'request') {
    return (
      <dl className="beat-figure beat-figure--request">
        <div className="beat-figure__row">
          <dt className="beat-figure__label">Persona policy</dt>
          <dd className="beat-figure__value mono">{figure.policyId}</dd>
        </div>
        <div className="beat-figure__row">
          <dt className="beat-figure__label">Event</dt>
          <dd className="beat-figure__value mono">{figure.eventType}</dd>
        </div>
      </dl>
    );
  }

  if (figure.kind === 'directives') {
    return (
      <div className="beat-figure beat-figure--directives">
        {figure.types.map((type) => (
          <DirectiveChip key={type} type={type} />
        ))}
      </div>
    );
  }

  if (figure.kind === 'seam') {
    return (
      <div className="seam beat-figure beat-figure--seam" role="separator" aria-orientation="horizontal">
        Janus decides · Fabric acts
      </div>
    );
  }

  if (figure.kind === 'scopes') {
    if (figure.scopes.length === 0) {
      return <p className="beat-figure beat-figure--empty">This outcome never reached a ticket.</p>;
    }
    // The point of the beat is the difference between the two lists.
    return (
      <dl className="beat-figure beat-figure--request">
        <div className="beat-figure__row">
          <dt className="beat-figure__label">Caller holds</dt>
          <dd className="beat-figure__value mono">
            <span className="visually-hidden">{figure.callerId}: </span>
            {figure.granted.join(' · ')}
          </dd>
        </div>
        <div className="beat-figure__row">
          <dt className="beat-figure__label">Ticket carries</dt>
          <dd className="beat-figure__value mono">{figure.scopes.join(' · ')}</dd>
        </div>
      </dl>
    );
  }

  return null;
}
