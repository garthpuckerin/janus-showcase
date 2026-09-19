
export function DirectiveStage({ directive }) {
  return (
    <div className="rail-stage">
      <h2 className="rail-stage__heading">Directive</h2>
      <div className="panel">
        <pre className="directive-json">{JSON.stringify(directive, null, 2)}</pre>
        <p className="page-framing">
          This directive carries no ticket, scope, authority or timeout — Janus decides; Fabric derives all of
          those, if it derives anything at all.
        </p>
      </div>
    </div>
  );
}
