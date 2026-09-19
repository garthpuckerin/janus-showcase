
export function Skeleton({ height = 16, width = '100%', className = '' }) {
  return <div className={`skeleton ${className}`.trim()} style={{ height, width }} aria-hidden="true" />;
}
