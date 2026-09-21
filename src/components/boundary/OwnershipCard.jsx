/** One ownership list — "Janus owns", "Janus refuses to own" or "Fabric
 *  owns" — rendered as a plain reviewable card. Used on both the light side
 *  (via `.card`) and, wrapped in `.panel-face`, on Fabric's side, where the
 *  foundation's `.panel-face .card` rule restyles it to the panel colours
 *  automatically. */
export function OwnershipCard({ title, items }) {
  return (
    <div className="card boundary-column">
      <div className="card__header">
        <span className="eyebrow">{title}</span>
      </div>
      <ul className="boundary-column__list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
