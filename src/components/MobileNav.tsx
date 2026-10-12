import { zones } from '../data/cv';
import type { ZoneKey } from '../types';

/** Bottom navigation for phones, tablets and short landscape screens. */
export function MobileNav({ onOpen }: { onOpen: (key: ZoneKey) => void }) {
  return (
    <nav className="bp-mnav" aria-label="CV sheets">
      {zones.map((z, i) => (
        <button key={z.key} type="button" className="bp-mbtn" onClick={() => onOpen(z.key)}>
          <span className="n">0{i + 1}</span>
          <span className="l">{z.short}</span>
          <span className="ab">{z.abbr}</span>
        </button>
      ))}
    </nav>
  );
}
