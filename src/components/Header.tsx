import { profile } from '../data/cv';

export function Header() {
  return (
    <header className="bp-head">
      <div className="bp-head-id">
        <h1 className="bp-h1">{profile.name}</h1>
        <div className="bp-role">
          &gt; {profile.role}
          <span className="caret">_</span>
        </div>
      </div>
      <div className="bp-hint" aria-hidden="true">
        <span className="bp-hint-row">
          <span className="bp-hint-dot" />
          HOVER A ZONE — IT RISES
        </span>
        <span>CLICK TO OPEN THAT SHEET</span>
      </div>
    </header>
  );
}
