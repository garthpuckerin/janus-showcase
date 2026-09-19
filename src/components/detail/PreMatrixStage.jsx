import { CheckCircle2, XCircle } from 'lucide-react';

export function PreMatrixStage({ trace }) {
  return (
    <div className="rail-stage">
      <h2 className="rail-stage__heading">Pre-matrix checks</h2>
      <div className="panel">
        <ul className="trace-list">
          {trace.map((step, index) => (
            <li key={`${step.check}-${index}`} className={`trace-item ${step.ok ? 'trace-item--pass' : 'trace-item--fail'}`}>
              {step.ok ? (
                <CheckCircle2 size={16} className="trace-item__icon" aria-hidden="true" />
              ) : (
                <XCircle size={16} className="trace-item__icon" aria-hidden="true" />
              )}
              <span>
                <strong>{step.check}</strong>
                {step.detail ? ` — ${step.detail}` : ''}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
