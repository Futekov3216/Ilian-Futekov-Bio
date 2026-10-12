import { Suspense, lazy, useEffect, useState } from 'react';
import { Header } from './components/Header';
import { MobileNav } from './components/MobileNav';
import { Reticle } from './components/Reticle';
import { Sheet } from './components/Sheet';
import { Spinner } from './components/Spinner';
import { SHEETS } from './components/sheets';
import { zoneByKey, zones } from './data/cv';
import { useSheetController } from './hooks/useSheetController';
import { useViewportHeight, useViewportWidth } from './hooks/useViewportWidth';
import { ZONE_KEYS } from './types';

// The blueprint brings three.js with it; loading it separately lets the header and a spinner show first.
const Blueprint = lazy(() => import('./components/Blueprint'));

export default function App() {
  const sheet = useSheetController();
  const viewportWidth = useViewportWidth();
  const viewportHeight = useViewportHeight();
  const [zoom, setZoom] = useState('1.0');

  const { open, reading, closing, focus, close, travel } = sheet;
  const idx = open ? ZONE_KEYS.indexOf(open) : 0;
  const prevKey = ZONE_KEYS[(idx + ZONE_KEYS.length - 1) % ZONE_KEYS.length]!;
  const nextKey = ZONE_KEYS[(idx + 1) % ZONE_KEYS.length]!;

  // Keyboard: Esc closes, ←/→ move between sheets.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (reading && e.key === 'ArrowLeft') travel(prevKey);
      else if (reading && e.key === 'ArrowRight') travel(nextKey);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, reading, close, travel, prevKey, nextKey]);

  const rootClass = ['bp-root', open && 'bp-focus', open && reading && 'bp-reading', closing && 'bp-closing']
    .filter(Boolean)
    .join(' ');

  const current = open ? zoneByKey[open] : null;
  const Content = open ? SHEETS[open] : null;

  return (
    <main className={rootClass}>
      <div className="bp-wrap" aria-hidden={reading || undefined}>
        <Header />
        <Suspense
          fallback={
            <div className="bp-stage">
              <Spinner />
            </div>
          }
        >
          <Blueprint focused={open} onOpen={focus} viewportWidth={viewportWidth} viewportHeight={viewportHeight} onZoom={setZoom} />
        </Suspense>
        <MobileNav onOpen={focus} />
      </div>

      <div className="bp-vig" aria-hidden="true" />
      {current && <Reticle key={`reticle-${current.key}`} zone={current.short} zoom={zoom} />}

      {current && reading && Content && (
        <Sheet
          key={`sheet-${current.key}`}
          title={current.title}
          prevLabel={zoneByKey[prevKey].short}
          nextLabel={zoneByKey[nextKey].short}
          counter={`SHEET 0${idx + 1} OF 0${zones.length}`}
          onClose={close}
          onPrev={() => travel(prevKey)}
          onNext={() => travel(nextKey)}
        >
          <Content />
        </Sheet>
      )}
    </main>
  );
}
