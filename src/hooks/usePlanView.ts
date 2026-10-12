import { useRef, useState, type MouseEvent, type PointerEvent, type RefObject } from 'react';
import { HOME, clampView, type View } from '../lib/view';

/** Finger travel (px) before a touch counts as a drag instead of a tap. */
const DRAG_THRESHOLD = 8;

interface Drag {
  id: number;
  startX: number;
  startY: number;
  from: View;
  moved: boolean;
}

/**
 * The visitor's own pan/zoom of the plan: state for the control buttons plus
 * drag-to-pan handlers for the stage. While `enabled` is false the view is
 * dropped, so the camera always starts from the untouched plan.
 */
export function usePlanView(stageRef: RefObject<HTMLDivElement | null>, enabled: boolean) {
  const [view, setView] = useState<View>(HOME);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<Drag | null>(null);
  const swallowClick = useRef(false);

  const [wasEnabled, setWasEnabled] = useState(enabled);
  if (enabled !== wasEnabled) {
    setWasEnabled(enabled);
    if (!enabled) setView(HOME);
  }

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    swallowClick.current = false;
    if (!enabled || !e.isPrimary) return;
    drag.current = { id: e.pointerId, startX: e.clientX, startY: e.clientY, from: view, moved: false };
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    const el = stageRef.current;
    if (!d || !el || e.pointerId !== d.id) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      d.moved = true;
      el.setPointerCapture(d.id);
      setDragging(true);
    }
    // The stage is shrunk with CSS `zoom`: convert screen px to stage px.
    const k = el.offsetWidth / (el.getBoundingClientRect().width || el.offsetWidth);
    setView(clampView({ ...d.from, x: d.from.x + dx * k, y: d.from.y + dy * k }));
  };

  const onPointerEnd = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    drag.current = null;
    if (!d.moved) return;
    swallowClick.current = true; // the finger was panning, not tapping a zone
    setDragging(false);
  };

  const onClickCapture = (e: MouseEvent<HTMLDivElement>) => {
    if (!swallowClick.current) return;
    swallowClick.current = false;
    e.preventDefault();
    e.stopPropagation();
  };

  return {
    view,
    setView,
    dragging,
    stageHandlers: { onPointerDown, onPointerMove, onPointerUp: onPointerEnd, onPointerCancel: onPointerEnd, onClickCapture },
  };
}
