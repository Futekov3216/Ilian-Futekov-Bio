import type { ZoneRect } from '../types';

/** Size of the blueprint plane in CSS px. */
export const PLANE_W = 900;
export const PLANE_H = 600;

/** Zoom every zone should reach when the stage has room for it. */
const MIN_ZOOM = 1.8;

export interface CameraPose {
  /** Magnification that makes the zone fill the stage. */
  scale: number;
  /** Zone centre relative to the plane centre, in plane px (y down). */
  cx: number;
  cy: number;
  /** `scale` formatted for the reticle readout. */
  zoom: string;
}

/**
 * Works out where the camera should be to face one zone: centred on it and
 * magnified so it fills about two thirds of the stage. `null` is the plan view.
 */
export function cameraFor(rect: ZoneRect | null, stageW: number, stageH: number): CameraPose {
  if (!rect) return { scale: 1, cx: 0, cy: 0, zoom: '1.0' };
  const sw = stageW || 1200;
  const sh = stageH || 640;
  const fitH = (sh * 0.62) / rect.h;
  const fit = Math.min((sw * 0.66) / rect.w, fitH);
  // Very wide zones (Contact) barely zoom at 2/3 width: let them use almost the full stage width.
  const wide = Math.min(MIN_ZOOM, (sw * 0.94) / rect.w, fitH);
  const scale = Math.max(1, Math.min(Math.max(fit, wide), 4.2));
  return {
    scale,
    cx: rect.x + rect.w / 2 - PLANE_W / 2,
    cy: rect.y + rect.h / 2 - PLANE_H / 2,
    zoom: scale.toFixed(1),
  };
}

/** Formats a delay in seconds for inline `animationDelay`. */
export const s = (seconds: number): string => `${seconds.toFixed(2)}s`;
