import { useEffect, useRef } from 'react';
import { useEntryGate } from '../../hooks/useEntryGate.js';
import { LandingView } from '../../views/LandingView.jsx';
import { OrientationDialog } from '../onboarding/OrientationDialog.jsx';
import { OrientationSteps } from '../onboarding/OrientationSteps.jsx';

/**
 * ISSUE-003: landing → orientation → app, for both shells. `children` is a
 * render prop — `(gate) => node` — so App.jsx keeps choosing which shell to
 * mount while this owns only the gate switch. The phone's orientation is its
 * own full-screen surface (`OrientationSteps` mounts INSTEAD of the running
 * app, not on top of it); the desktop's is a modal OVER the running app,
 * which this inerts via a ref rather than a JSX `inert` prop — React 18's
 * support for that attribute is inconsistent, and a raw DOM call is exact.
 */
export function EntryGate({ isWorkstation, children }) {
  const gate = useEntryGate();
  const appRootRef = useRef(null);
  const dialogOpen = isWorkstation && gate.stage === 'onboarding';

  useEffect(() => {
    const node = appRootRef.current;
    if (!node) return;
    node.toggleAttribute('inert', dialogOpen);
    node.setAttribute('aria-hidden', dialogOpen ? 'true' : 'false');
  }, [dialogOpen]);

  if (gate.stage === 'landing') {
    return <LandingView onEnter={gate.enter} />;
  }

  if (!isWorkstation && gate.stage === 'onboarding') {
    return <OrientationSteps onFinish={gate.finishOnboarding} />;
  }

  return (
    <>
      <div ref={appRootRef}>{children({ replayIntro: gate.replay })}</div>
      {dialogOpen && <OrientationDialog onFinish={gate.finishOnboarding} />}
    </>
  );
}
