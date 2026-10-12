/** Loupe viewfinder shown while the camera zooms in on a zone. */
export function Reticle({ zone, zoom }: { zone: string; zoom: string }) {
  return (
    <div className="bp-reticle" aria-hidden="true">
      <span className="rc tl" />
      <span className="rc tr" />
      <span className="rc bl" />
      <span className="rc br" />
      <span className="cross" />
      <span className="ro">
        FOCUS ▸ {zone} · LOUPE ×{zoom}
      </span>
    </div>
  );
}
