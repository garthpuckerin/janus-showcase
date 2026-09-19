
export function TopBar() {
  return (
    <header className="app-topbar">
      <div className="app-topbar__brand">
        <span className="app-topbar__title">Janus</span>
        <span className="app-topbar__tagline">decision engine cockpit</span>
      </div>
      <span className="badge" role="status">Mock data · engine is private</span>
    </header>
  );
}
