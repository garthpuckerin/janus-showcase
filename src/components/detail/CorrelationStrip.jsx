import { Check, X } from 'lucide-react';

/** request_id / directive_id / ticket_id, each with an equality mark computed
 *  by comparing the actual values — never asserted. */
export function CorrelationStrip({ directive, ticket }) {
  const items = [
    { label: 'request_id', value: directive.request_id, matches: ticket ? ticket.request_id === directive.request_id : null },
    { label: 'directive_id', value: directive.directive_id, matches: ticket ? ticket.directive_id === directive.directive_id : null },
  ];
  if (ticket) {
    items.push({ label: 'ticket_id', value: ticket.ticket_id, matches: true });
  }

  return (
    <div className="correlation-strip panel" aria-label="Correlation across the boundary">
      {items.map((item) => (
        <span key={item.label} className="correlation-item">
          <span className="not-applicable">{item.label}:</span> {item.value}
          {item.matches === null ? (
            <span className="not-applicable" aria-label="not applicable">
              —
            </span>
          ) : item.matches ? (
            <Check size={14} className="correlation-item__check" aria-label="matches" />
          ) : (
            <X size={14} className="correlation-item__cross" aria-label="does not match" />
          )}
        </span>
      ))}
    </div>
  );
}
