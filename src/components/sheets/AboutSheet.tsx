import { profile } from '../../data/cv';
import { s } from '../../lib/camera';

export function AboutSheet() {
  return (
    <div className="about">
      <div className="about-text">
        <p className="about-lead rise" style={{ animationDelay: s(1.15) }}>
          {profile.intro}
        </p>
        <p className="about-bio rise" style={{ animationDelay: s(1.25) }}>
          {profile.bio}
        </p>
        <div className="about-links rise" style={{ animationDelay: s(1.35) }}>
          <a className="bp-btn ghost-link" href={profile.linkedin} target="_blank" rel="noopener noreferrer">
            LINKEDIN ↗
          </a>
          <a className="bp-btn ghost-link" href={profile.github} target="_blank" rel="noopener noreferrer">
            GITHUB ↗
          </a>
        </div>
      </div>

      <dl className="about-facts" style={{ margin: 0 }}>
        {profile.facts.map((f, i) => (
          <div key={f.k} className="fact" style={{ animationDelay: s(1.2 + i * 0.1) }}>
            <dt className="fact-k">{f.k}</dt>
            <dd className="fact-v" style={{ marginLeft: 0 }}>
              {f.v}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
