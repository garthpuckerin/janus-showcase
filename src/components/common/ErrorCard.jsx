import { AlertTriangle } from 'lucide-react';
import { DataState } from './DataState.jsx';

/** Thin wrapper over `DataState` so existing `<ErrorCard message onRetry />`
 *  call sites keep working unchanged. */
export function ErrorCard({ message, onRetry }) {
  return (
    <DataState
      tone="danger"
      title={
        <>
          <AlertTriangle size={16} aria-hidden="true" /> Something went wrong
        </>
      }
      action={
        onRetry && (
          <button type="button" className="button" onClick={onRetry}>
            Try again
          </button>
        )
      }
    >
      {message}
    </DataState>
  );
}
