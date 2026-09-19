
export function PlaceholderView({ title, description }) {
  return (
    <section aria-labelledby="placeholder-heading">
      <div className="page-header">
        <h1 id="placeholder-heading">{title}</h1>
      </div>
      <div className="placeholder-panel">
        <h2>Coming in the next build step</h2>
        <p>{description}</p>
      </div>
    </section>
  );
}
