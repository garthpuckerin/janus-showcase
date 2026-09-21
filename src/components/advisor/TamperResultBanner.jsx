import { DataState } from '../common/DataState.jsx';

/** Shown above the Clarify result rail only when the caller tampered with
 *  the continuation before sending it back. The wording is conditional on
 *  the MEASURED port-call count — never an unconditional assertion that the
 *  model was never touched. */
export function TamperResultBanner({ portCallCount }) {
  return (
    <DataState tone="danger" title="Tampered continuation sent">
      {portCallCount === 0 ? (
        <>
          The model was not called — the continuation is revalidated before model participation, so this one
          never reached the port.
        </>
      ) : (
        <>Unexpected: the model port was called during this evaluation.</>
      )}
    </DataState>
  );
}
