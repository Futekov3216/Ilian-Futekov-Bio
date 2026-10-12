import { useEffect, useRef, useState, type Dispatch, type KeyboardEvent, type PointerEvent, type SetStateAction } from 'react';
import { HOME, ZOOM_MAX, ZOOM_MIN, ZOOM_STEP, glideBy, isHome, panBy, zoomTo, type View } from '../lib/view';

interface ViewControlsProps {
  view: View;
  onChange: Dispatch<SetStateAction<View>>;
  /** True while a control is being held, so the plan follows without easing. */
  onLive: (live: boolean) => void;
}

/** How far (px) the joystick knob can be pushed from the centre. */
const KNOB_REACH = 30;

const ARROWS: Record<string, [number, number]> = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
};

/** Zoom slider and a joystick for exploring the plan on small screens. */
export function ViewControls({ view, onChange, onLive }: ViewControlsProps) {
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const [held, setHeld] = useState(false);
  // Joystick deflection, -1..1 on each axis, read by the animation loop.
  const tilt = useRef({ x: 0, y: 0 });
  const frame = useRef(0);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const steer = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    const k = Math.min(1, KNOB_REACH / (Math.hypot(dx, dy) || 1));
    setKnob({ x: dx * k, y: dy * k });
    tilt.current = { x: (dx * k) / KNOB_REACH, y: (dy * k) / KNOB_REACH };
  };

  const onStickDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!e.isPrimary) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    steer(e);
    setHeld(true);
    onLive(true);

    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const { x, y } = tilt.current;
      if (x || y) onChange((v) => glideBy(v, x, y, dt));
      frame.current = requestAnimationFrame(tick);
    };
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(tick);
  };

  const onStickMove = (e: PointerEvent<HTMLDivElement>) => {
    if (held && e.isPrimary) steer(e);
  };

  const onStickEnd = () => {
    if (!held) return;
    cancelAnimationFrame(frame.current);
    tilt.current = { x: 0, y: 0 };
    setKnob({ x: 0, y: 0 });
    setHeld(false);
    onLive(false);
  };

  const onStickKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const dir = ARROWS[e.key];
    if (!dir) return;
    e.preventDefault();
    onChange((v) => panBy(v, dir[0], dir[1]));
  };

  return (
    <div className="bp-vctl">
      <div className="bp-vzoom">
        <span className="bp-vlevel">×{view.zoom.toFixed(1)}</span>
        <input
          className="bp-vslider"
          type="range"
          min={ZOOM_MIN}
          max={ZOOM_MAX}
          step={ZOOM_STEP}
          value={view.zoom}
          onChange={(e) => onChange((v) => zoomTo(v, Number(e.target.value)))}
          onPointerDown={() => onLive(true)}
          onPointerUp={() => onLive(false)}
          onPointerCancel={() => onLive(false)}
          aria-label="Zoom the blueprint"
          aria-valuetext={`×${view.zoom.toFixed(1)}`}
        />
        <button type="button" className="bp-vbtn" onClick={() => onChange(HOME)} disabled={isHome(view)} aria-label="Reset the view">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <circle cx="8" cy="8" r="4.5" />
            <path d="M8 0v4M8 12v4M0 8h4M12 8h4" />
          </svg>
        </button>
      </div>

      <div
        className={`bp-vstick${held ? ' held' : ''}`}
        role="group"
        tabIndex={0}
        aria-label="Move the blueprint: drag the stick or use the arrow keys"
        onPointerDown={onStickDown}
        onPointerMove={onStickMove}
        onPointerUp={onStickEnd}
        onPointerCancel={onStickEnd}
        onKeyDown={onStickKey}
      >
        <span className="bp-vknob" style={{ transform: `translate(${knob.x.toFixed(1)}px, ${knob.y.toFixed(1)}px)` }} />
      </div>
    </div>
  );
}
