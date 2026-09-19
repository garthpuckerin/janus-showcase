import { DirectiveChip } from '../common/DirectiveChip.jsx';
import { policyRefLabel, relativeTimeFromNow, modelStatusLabel } from '../../utils/format.js';

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
        <caption className="visually-hidden">Decision ledger: one row per evaluated request.</caption>
        <thead>
          <tr>
            <th scope="col">When</th>
            <th scope="col">Decision · persona policy · event</th>
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
                <td data-label="Decision" className="decisions-table__title-cell">
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
                  <span className="decisions-table__meta">
                    <span className="visually-hidden">Persona policy </span>
                    {policyRefLabel(scenario.request.persona.policy_id, scenario.request.persona.policy_version)}
                    <span aria-hidden="true"> · </span>
                    <span className="visually-hidden">, event </span>
                    {scenario.request.event.type}
                  </span>
                </td>
                <td data-label="Directive">
                  <DirectiveChip type={evaluation.directive.type} />
                </td>
                <td data-label="Matrix row">
                  <span className="matrix-row-tag">
                    {evaluation.diagnostics.matrix_row === null ? 'pre-matrix' : `row ${evaluation.diagnostics.matrix_row}`}
                  </span>
                </td>
                <td data-label="Model" title={evaluation.diagnostics.model_status}>
                  {modelStatusLabel(evaluation.diagnostics.model_status)}
                </td>
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
