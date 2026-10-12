/** Shown in the stage while the blueprint's engine and fonts load, so the plan appears in one piece. */
export function Spinner() {
  return (
    <div className="bp-spinner" role="status">
      <span className="bp-spinner-ring" aria-hidden="true" />
      <span className="bp-spinner-text">LOADING PLAN</span>
    </div>
  );
}
