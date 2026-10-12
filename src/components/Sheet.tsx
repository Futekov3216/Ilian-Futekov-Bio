import { useEffect, useRef, type ReactNode } from 'react';

interface SheetProps {
  title: string;
  prevLabel: string;
  nextLabel: string;
  counter: string;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  children: ReactNode;
}

/**
 * The unfolding sheet that shows a zone's content. Opening (`unfold`) and
 * closing (`foldOut`, via `.bp-closing` on the root) are pure CSS.
 */
export function Sheet({ title, prevLabel, nextLabel, counter, onClose, onPrev, onNext, children }: SheetProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // New sheet → scroll to top and move focus inside the dialog.
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
    closeRef.current?.focus({ preventScroll: true });
  }, [title]);

  return (
    <div className="bp-ov">
      <button type="button" className="bp-scrim" onClick={onClose} aria-label="Close sheet" tabIndex={-1} />

      <div role="dialog" aria-modal="true" aria-label={title} className="bp-dlg">
        <span className="dlg-sweep down" />
        <span className="dlg-sweep up" />
        <span className="dlg-corner tl" />
        <span className="dlg-corner tr" />
        <span className="dlg-corner bl" />
        <span className="dlg-corner br" />

        <div className="bp-bar">
          <h2 className="bp-bartitle">
            <span className="dot-live" />
            {title}
          </h2>
          <button ref={closeRef} type="button" className="bp-btn bp-navbtn strong" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M1 1l12 12M13 1L1 13" />
            </svg>
            BACK TO PLAN
          </button>
        </div>

        <div className="bp-body" ref={bodyRef}>
          {children}
        </div>

        <div className="bp-foot">
          <button type="button" className="bp-btn bp-navbtn" onClick={onPrev}>
            ← {prevLabel}
          </button>
          <span className="bp-count">{counter}</span>
          <button type="button" className="bp-btn bp-navbtn" onClick={onNext}>
            {nextLabel} →
          </button>
        </div>
      </div>
    </div>
  );
}
