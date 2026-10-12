import { skillGroups } from '../../data/cv';
import { s } from '../../lib/camera';

/** Material-schedule hatch swatch per group. */
const HATCHES = [
  'repeating-linear-gradient(45deg, #C9DDF5 0 1px, transparent 1px 6px)',
  'repeating-linear-gradient(-45deg, #C9DDF5 0 1px, transparent 1px 6px)',
  'repeating-linear-gradient(0deg, #C9DDF5 0 1px, transparent 1px 6px)',
  'radial-gradient(#C9DDF5 1px, transparent 1.5px)',
  'repeating-linear-gradient(90deg, #C9DDF5 0 1px, transparent 1px 6px)',
];

export function SkillsSheet() {
  return (
    <div className="skills">
      {skillGroups.map((g, i) => {
        const base = 1.3 + i * 0.12;
        return (
          <div key={g.name} className="bp-card panel skill-card" style={{ animationDelay: s(1.15 + i * 0.1) }}>
            <div className="skill-head">
              <span className="kicker">
                MAT-{String(i + 1).padStart(2, '0')} · {g.items.length} ITEMS
              </span>
              <span className="skill-hatch" style={{ backgroundImage: HATCHES[i % HATCHES.length] }} />
            </div>
            <div className="skill-name">{g.name}</div>
            <div className="skill-bar" style={{ animationDelay: s(base) }} />
            <div className="chips">
              {g.items.map((item, j) => (
                <span key={item} className="chip" style={{ animationDelay: s(base + 0.2 + j * 0.05) }}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
