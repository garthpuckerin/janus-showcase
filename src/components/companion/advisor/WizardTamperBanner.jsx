import { DataState } from '../../common/DataState.jsx';

/** The banner shown above a tampered Clarify result — wording conditional on
 *  the MEASURED port-call count, never an unconditional assertion that the
 *  model was never touched. */
export function WizardTamperBanner({ portCallCount }) {
  return (
    <DataState tone="danger" title="Tampered continuation sent">
      {portCallCount === 0 ? (
        <>
          The model was not called — the continuation is revalidated before model participation, so this one never
          reached the port.
        </>
      ) : (
        <>Unexpected: the model port was called during this evaluation.</>
      )}
    </DataState>
  );
}
