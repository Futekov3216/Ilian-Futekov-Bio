import { education } from '../../data/cv';
import { s } from '../../lib/camera';

export function EducationSheet() {
  return (
    <div className="edu">
      <article className="bp-card panel edu-card">
        <div className="edu-stamp">GRADUATED</div>
        <h3 className="edu-title">{education.institution}</h3>
        <div className="edu-meta">{education.shortPeriod}</div>
        <div className="edu-degree">
          {education.degree} · {education.field}
        </div>
        <div className="edu-rule" />
        <div className="kicker">COURSES INCLUDED</div>
        <div className="chips">
          {education.courses.map((c, i) => (
            <span key={c} className="chip" style={{ animationDelay: s(1.5 + i * 0.06) }}>
              {c}
            </span>
          ))}
        </div>
      </article>

      <dl className="edu-facts" style={{ margin: 0 }}>
        {education.facts.map((f, i) => (
          <div key={f.k} className="fact" style={{ animationDelay: s(1.25 + i * 0.1) }}>
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
