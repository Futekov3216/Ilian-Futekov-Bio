import { roles } from '../../data/cv';
import { s } from '../../lib/camera';

export function ExperienceSheet() {
  return (
    <div className="roles">
      {roles.map((r, i) => (
        <article key={`${r.company}-${r.dates}`} className="bp-card panel role-card" style={{ animationDelay: s(1.1 + i * 0.32) }}>
          <h3 className="role-title">
            {r.role} <span className="role-company">@ {r.company}</span>
          </h3>
          <div className="role-dates">{r.dates}</div>
          <ul className="role-points">
            {r.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <div className="chips">
            {r.tags.map((t) => (
              <span key={t} className="chip dashed">
                {t}
              </span>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}
