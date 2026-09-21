import { useMemo } from 'react';
import { Wordmark } from '../components/layout/Wordmark.jsx';
import { LandingIdentityStrip } from '../components/landing/LandingIdentityStrip.jsx';
import { useWorkstation } from '../hooks/useWorkstation.js';
import { LEDGER } from '../data/ledger.js';

const ANCHOR = LEDGER[0];

/**
 * ISSUE-003: the landing gate. One screen, no scrolling — the honesty line
 * ("mock data · the engine is private") is visible text here, before
 * anything else, not a tooltip a visitor could miss. The two-faces device
 * carries the composition: Janus's copy on the light side, a static
 * rendition of the anchor scenario's identity chain on Fabric's `.panel-face`
 * dark side, split by the seam — the SAME device the app uses everywhere
 * else, at hero scale. `useWorkstation().isWorkstation` picks which of the
 * two layouts renders; CSS never invents a second breakpoint for it.
 */
export function LandingView({ onEnter }) {
  const { isWorkstation } = useWorkstation();

  const identity = useMemo(
    () => ({
      request: ANCHOR.scenario.request,
      directive: ANCHOR.evaluation.directive,
      ticket: ANCHOR.fabric?.kind === 'ticket' ? ANCHOR.fabric.ticket : null,
      outcome: ANCHOR.fabric?.kind === 'ticket' ? ANCHOR.fabric.outcome : null,
    }),
    [],
  );

  return (
    <div className={`landing ${isWorkstation ? 'landing--workstation' : 'landing--companion'}`}>
      <div className="landing__face landing__face--light">
        <Wordmark className="landing__wordmark" />

        <div className="landing__copy">
          <h1 className="landing__title">Janus decides. Fabric acts.</h1>
          <p className="landing__lede">
            A policy-bound decision engine for agentic systems. One request in, exactly one directive
            out — advise, activate a shard, or ask for input. Janus never executes; a separate runtime
            derives the ticket.
          </p>
          <p className="landing__honesty">Frontend-only operator console · mock data · the engine is private.</p>
          <button type="button" className="button landing__enter" onClick={onEnter} autoFocus>
            Enter the console
          </button>
        </div>
      </div>

      <div className="seam landing__seam" role="separator" aria-orientation="horizontal">
        Janus decides · Fabric acts
      </div>

      <div className="panel-face landing__face landing__face--dark">
        <div className="landing__dark-inner">
          <p className="eyebrow landing__eyebrow">Identity chain · {ANCHOR.scenario.title}</p>
          <LandingIdentityStrip {...identity} />
        </div>
      </div>
    </div>
  );
}
