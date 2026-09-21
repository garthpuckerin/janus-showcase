/** The canonical rendering for protocol JSON (directive, continuation,
 *  ticket): a mono uppercase caption naming the document type, above a
 *  `pre` block that always renders on `--color-panel` regardless of theme
 *  or which side of the boundary it sits on — payloads are the contract,
 *  and the contract looks the same everywhere. Not yet wired into the
 *  screens; screen agents adopt it view by view. */
export function Payload({ caption, value }) {
  return (
    <div className="payload">
      {caption && <span className="payload__caption">{caption}</span>}
      <pre>{JSON.stringify(value, null, 2)}</pre>
    </div>
  );
}
