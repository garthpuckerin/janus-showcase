import { DataState } from './DataState.jsx';

/** Thin wrapper over `DataState` so existing `<EmptyState message="..." />`
 *  call sites keep working unchanged. */
export function EmptyState({ message }) {
  return <DataState tone="neutral">{message}</DataState>;
}
