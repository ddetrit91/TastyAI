/** Stronger floating 3D objects for the main app shell. */
export function AppBackground() {
  return (
    <div className="app-3d" aria-hidden>
      <div className="app-3d__glow app-3d__glow--tl" />
      <div className="app-3d__glow app-3d__glow--br" />
      <div className="app-3d__glow app-3d__glow--mid" />

      <div className="app-3d__scene">
        <div className="app-3d__orb app-3d__orb--1">
          <span className="app-3d__spec" />
        </div>
        <div className="app-3d__orb app-3d__orb--2">
          <span className="app-3d__spec" />
        </div>
        <div className="app-3d__orb app-3d__orb--3">
          <span className="app-3d__spec" />
        </div>
        <div className="app-3d__orb app-3d__orb--4">
          <span className="app-3d__spec" />
        </div>
        <div className="app-3d__orb app-3d__orb--5">
          <span className="app-3d__spec" />
        </div>

        <div className="app-3d__disc app-3d__disc--a" />
        <div className="app-3d__disc app-3d__disc--b" />

        <div className="app-3d__ring app-3d__ring--a" />
        <div className="app-3d__ring app-3d__ring--b" />
        <div className="app-3d__ring app-3d__ring--c" />

        <div className="app-3d__shadow app-3d__shadow--1" />
        <div className="app-3d__shadow app-3d__shadow--2" />
        <div className="app-3d__shadow app-3d__shadow--3" />

        <div className="app-3d__plane" />
      </div>

      <div className="app-3d__grid" />
      <div className="app-3d__vignette" />
    </div>
  );
}
