import { DirectiveChip } from '../common/DirectiveChip.jsx';
import { policyRefLabel, relativeTimeFromNow } from '../../utils/format.js';

function fabricSummary(entry) {
  if (!entry.fabric) return { text: 'Not applicable', ariaLabel: 'not applicable', className: 'not-applicable' };
  if (entry.fabric.kind === 'ticket') {
    return { text: `Ticket ${entry.fabric.ticket.ticket_id}`, className: '' };
  }
  return { text: `Rejected · ${entry.fabric.rejection.code}`, className: '' };
}

export function DecisionsTable({ rows, now, onSelectScenario }) {
  return (
    <div className="panel decisions-table-wrap">
      <table className="decisions-table">
        <thead>
          <tr>
            <th scope="col">When</th>
            <th scope="col">Decision</th>
            <th scope="col">Persona policy</th>
            <th scope="col">Event</th>
            <th scope="col">Directive</th>
            <th scope="col">Matrix row</th>
            <th scope="col">Model</th>
            <th scope="col">Fabric result</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((entry) => {
            const fabric = fabricSummary(entry);
            const { scenario, evaluation } = entry;
            return (
              <tr key={scenario.id} onClick={() => onSelectScenario(scenario.id)}>
                <td data-label="When">{relativeTimeFromNow(scenario.occurredAt, now)}</td>
                <td data-label="Decision">
                  <button
                    type="button"
                    className="decisions-table__row-button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectScenario(scenario.id);
                    }}
                  >
                    <span className="decisions-table__title">{scenario.title}</span>
                  </button>
                </td>
                <td data-label="Persona policy">{policyRefLabel(scenario.request.persona.policy_id, scenario.request.persona.policy_version)}</td>
                <td data-label="Event">{scenario.request.event.type}</td>
                <td data-label="Directive">
                  <DirectiveChip type={evaluation.directive.type} />
                </td>
                <td data-label="Matrix row">
                  <span className="matrix-row-tag">
                    {evaluation.diagnostics.matrix_row === null ? 'pre-matrix' : `row ${evaluation.diagnostics.matrix_row}`}
                  </span>
                </td>
                <td data-label="Model">{evaluation.diagnostics.model_status}</td>
                <td data-label="Fabric result">
                  <span className={fabric.className} aria-label={fabric.ariaLabel}>
                    {fabric.text}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
