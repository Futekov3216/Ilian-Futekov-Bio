/** The visitor's own pan/zoom of the plan (small screens only), in stage px. */
export interface View {
  x: number;
  y: number;
  zoom: number;
}

export const HOME: View = { x: 0, y: 0, zoom: 1 };

export const ZOOM_MIN = 1;
export const ZOOM_MAX = 3;
/** Granularity of the zoom slider. */
export const ZOOM_STEP = 0.1;
/** Distance one arrow-key press moves the plan. */
const PAN_STEP = 130;
/** Speed (px/s at zoom 1) of the plan with the joystick pushed all the way. */
const GLIDE_SPEED = 520;
/** How far the plan may be pushed off-centre at zoom 1; grows with the zoom. */
const PAN_LIMIT_X = 320;
const PAN_LIMIT_Y = 220;

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export function clampView(v: View): View {
  const zoom = clamp(v.zoom, ZOOM_MIN, ZOOM_MAX);
  return {
    zoom,
    x: clamp(v.x, -PAN_LIMIT_X * zoom, PAN_LIMIT_X * zoom),
    y: clamp(v.y, -PAN_LIMIT_Y * zoom, PAN_LIMIT_Y * zoom),
  };
}

/** Sets the zoom, keeping the centre of the stage fixed. */
export function zoomTo(v: View, target: number): View {
  const zoom = clamp(target, ZOOM_MIN, ZOOM_MAX);
  const k = zoom / v.zoom;
  return clampView({ zoom, x: v.x * k, y: v.y * k });
}

/** Moves the camera one step: `dx: 1` looks right, so the plan slides left. */
export function panBy(v: View, dx: number, dy: number): View {
  return clampView({ ...v, x: v.x - dx * PAN_STEP, y: v.y - dy * PAN_STEP });
}

/** Joystick motion: `tx`/`ty` are the stick deflection (-1..1), `dt` the frame time in seconds. */
export function glideBy(v: View, tx: number, ty: number, dt: number): View {
  const d = GLIDE_SPEED * Math.sqrt(v.zoom) * dt;
  return clampView({ ...v, x: v.x - tx * d, y: v.y - ty * d });
}

export const isHome = (v: View): boolean => v.x === 0 && v.y === 0 && v.zoom === 1;
