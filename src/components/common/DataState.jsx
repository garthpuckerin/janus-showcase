/** The single shared pattern for empty / loading / error / not-applicable /
 *  desk-only states: a 4px left mark, a title, one sentence, an optional
 *  action. `tone` picks the mark colour; it is never the only signal — the
 *  title text always names what happened. */
export function DataState({ tone = 'neutral', title, children, action }) {
  const role = tone === 'danger' ? 'alert' : 'status';
  return (
    <div className={`data-state data-state--${tone}`} role={role}>
      {title && <h2>{title}</h2>}
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}
