import { DirectiveChip } from '../common/DirectiveChip.jsx';
import { policyRefLabel, relativeTimeFromNow, modelStatusLabel } from '../../utils/format.js';

/** The Fabric-result cell: a ticket id (mono, positive dot), a verbatim
 *  rejection code (danger chip), or an em dash for directives that never
 *  reach Fabric at all. Every branch is read off `entry.fabric` itself. */
function FabricResultCell({ fabric }) {
  if (!fabric) {
    return (
      <span aria-label="not applicable" className="not-applicable">
        —
      </span>
    );
  }
  if (fabric.kind === 'ticket') {
    return (
      <span className="decisions-table__fabric-result">
        <span className="decisions-table__dot decisions-table__dot--positive" aria-hidden="true" />
        <code>{fabric.ticket.ticket_id}</code>
      </span>
    );
  }
  return <span className="chip chip--danger">{fabric.rejection.code}</span>;
}

export function DecisionsTable({ rows, now, onSelectScenario }) {
  return (
    <div className="data-table-wrap">
      <table className="data-table decisions-table">
        <caption className="visually-hidden">Decision ledger: one row per evaluated request.</caption>
        <thead>
          <tr>
            <th scope="col">When</th>
            <th scope="col">Decision · persona policy · event</th>
            <th scope="col">Directive</th>
            <th scope="col" className="decisions-table__wide-only">Matrix row</th>
            <th scope="col" className="decisions-table__wide-only">Model</th>
            <th scope="col">Fabric result</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((entry) => {
            const { scenario, evaluation, fabric } = entry;
            return (
              <tr key={scenario.id} onClick={() => onSelectScenario(scenario.id)}>
                <td data-label="When" className="decisions-table__when">
                  {relativeTimeFromNow(scenario.occurredAt, now)}
                </td>
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
                  {/* Below 1360px the Matrix-row and Model columns fold into
                      this line, so the ledger fits a laptop and a landscape
                      tablet with four columns instead of overflowing with six. */}
                  <span className="decisions-table__meta decisions-table__narrow-only">
                    <span className="visually-hidden">Matrix row </span>
                    {evaluation.diagnostics.matrix_row === null ? 'pre-matrix' : `row ${evaluation.diagnostics.matrix_row}`}
                    <span aria-hidden="true"> · </span>
                    <span className="visually-hidden">, model </span>
                    {modelStatusLabel(evaluation.diagnostics.model_status)}
                  </span>
                </td>
                <td data-label="Directive">
                  <DirectiveChip type={evaluation.directive.type} />
                </td>
                <td data-label="Matrix row" className="decisions-table__matrix-row decisions-table__wide-only">
                  {evaluation.diagnostics.matrix_row === null ? 'pre-matrix' : `row ${evaluation.diagnostics.matrix_row}`}
                </td>
                <td
                  data-label="Model"
                  title={evaluation.diagnostics.model_status}
                  className="decisions-table__wide-only"
                >
                  {modelStatusLabel(evaluation.diagnostics.model_status)}
                </td>
                <td data-label="Fabric result">
                  <FabricResultCell fabric={fabric} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
