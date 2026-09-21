/** One segment of the directive-type filter (rendered inside a `.segmented`
 *  group). The count is always the caller's derived count for this filter,
 *  in mono tabular-nums, never a hand-typed figure. */
export function FilterChip({ label, count, active, onClick }) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick}>
      {label} <span className="decisions-filter__count">{count}</span>
    </button>
  );
}
