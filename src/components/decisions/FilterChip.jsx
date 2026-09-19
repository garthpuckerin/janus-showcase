
export function FilterChip({ label, count, active, onClick }) {
  return (
    <button
      type="button"
      className={`filter-chip${active ? ' filter-chip--active' : ''}`}
      aria-pressed={active}
      onClick={onClick}
    >
      {label} <span className="filter-chip__count">{count}</span>
    </button>
  );
}
