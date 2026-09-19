import { AlertTriangle } from 'lucide-react';

export function ErrorCard({ message, onRetry }) {
  return (
    <div className="error-card" role="alert">
      <h2>
        <AlertTriangle size={18} aria-hidden="true" /> Something went wrong
      </h2>
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="button" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
