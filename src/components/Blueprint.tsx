import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from 'react';
import { profile, zoneByKey, zones } from '../data/cv';
import { useElementSize } from '../hooks/useElementSize';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { usePlanView } from '../hooks/usePlanView';
import { cameraFor } from '../lib/camera';
import { BlueprintScene } from '../three/BlueprintScene';
import type { ZoneKey } from '../types';
import { Spinner } from './Spinner';
import { ViewControls } from './ViewControls';

/** Screens that get the mobile nav also get the pan/zoom controls — keep in sync with the CSS. */
const SMALL_SCREEN = '(max-width: 820px), (max-height: 560px)';

interface BlueprintProps {
  /** Zone the camera is focused on (null = plan view). */
  focused: ZoneKey | null;
  onOpen: (key: ZoneKey) => void;
  /** Live viewport size, printed on the two dimension lines. */
  viewportWidth: number;
  viewportHeight: number;
  /** Reports the current loupe magnification to the parent. */
  onZoom?: (zoom: string) => void;
}

/**
 * The 3D blueprint, drawn with three.js on one WebGL canvas: hover a zone to
 * raise it, click to open it, and pan/zoom on small screens. The scene itself
 * lives in `three/BlueprintScene.ts`; this component feeds it React state and
 * pointer input, and shows a spinner until it is ready to appear in one piece.
 */
export default function Blueprint({ focused, onOpen, viewportWidth, viewportHeight, onZoom }: BlueprintProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<BlueprintScene | null>(null);
  const stage = useElementSize(stageRef);
  const cam = cameraFor(focused ? zoneByKey[focused].rect : null, stage.width, stage.height);

  useEffect(() => {
    onZoom?.(cam.zoom);
  }, [cam.zoom, onZoom]);

  const small = useMediaQuery(SMALL_SCREEN);
  const { view, setView, dragging, stageHandlers } = usePlanView(stageRef, small, focused !== null);
  // A held slider or joystick drives the plan directly, like a drag.
  const [live, setLive] = useState(false);
  const [hover, setHover] = useState<ZoneKey | null>(null);
  const [ready, setReady] = useState(false);

  // Create the scene once, and keep its canvas sized to the stage.
  useEffect(() => {
    const el = stageRef.current;
    const canvas = canvasRef.current;
    if (!el || !canvas) return;
    const host = profile.site.replace(/^https?:\/\//, '');
    const scene = new BlueprintScene(canvas, zones, host, () => setReady(true));
    sceneRef.current = scene;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      // The stage is sized with CSS `zoom`: k = screen px per stage px.
      const k = rect.width / (el.offsetWidth || 1) || 1;
      // Let the canvas reach up to the top of the page, so the plan's far
      // corner and the holograms can rise over the header.
      const extraTop = Math.max(0, rect.top / k);
      canvas.style.top = `${-extraTop}px`;
      canvas.style.height = `${el.offsetHeight + extraTop}px`;
      scene.setLayout({
        width: el.offsetWidth,
        height: el.offsetHeight,
        extraTop,
        lift: parseFloat(getComputedStyle(el).paddingBottom) / 2 || 0,
        pixelRatio: Math.min(3, Math.max(1.5, window.devicePixelRatio * k)),
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    window.addEventListener('resize', measure);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    sceneRef.current?.setCamera(focused ? { scale: cam.scale, cx: cam.cx, cy: cam.cy } : null);
    sceneRef.current?.setActive(focused);
  }, [focused, cam.scale, cam.cx, cam.cy]);

  useEffect(() => {
    sceneRef.current?.setView(view, dragging || live);
  }, [view, dragging, live]);

  useEffect(() => {
    sceneRef.current?.setViewport(viewportWidth, viewportHeight);
  }, [viewportWidth, viewportHeight]);

  useEffect(() => {
    sceneRef.current?.setHover(focused ? null : hover);
  }, [hover, focused]);

  /** The zone under a pointer position, by casting a ray into the scene. */
  const zoneAt = (clientX: number, clientY: number): ZoneKey | null => {
    const canvas = canvasRef.current;
    const scene = sceneRef.current;
    if (!canvas || !scene || !ready) return null;
    const r = canvas.getBoundingClientRect();
    return scene.pick(((clientX - r.left) / r.width) * 2 - 1, 1 - ((clientY - r.top) / r.height) * 2);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    stageHandlers.onPointerMove(e);
    // Hover only exists for a mouse; touch opens zones by tapping.
    if (e.pointerType === 'mouse') setHover(zoneAt(e.clientX, e.clientY));
  };

  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    const key = zoneAt(e.clientX, e.clientY);
    if (key) onOpen(key);
  };

  return (
    <>
      <div
        className="bp-stage"
        ref={stageRef}
        style={{ cursor: hover ? 'pointer' : undefined }}
        {...stageHandlers}
        onPointerMove={onPointerMove}
        onPointerLeave={() => setHover(null)}
        onClick={onClick}
      >
        <canvas className={`bp-gl${ready ? ' ready' : ''}`} ref={canvasRef} aria-hidden="true" />
        {!ready && <Spinner />}
        {/* The canvas is a picture; these give keyboard and screen-reader users the same zones. */}
        <div className="bp-sr">
          {zones.map((z) => (
            <button
              key={z.key}
              type="button"
              onFocus={() => setHover(z.key)}
              onBlur={() => setHover(null)}
              onClick={(e) => {
                e.stopPropagation();
                onOpen(z.key);
              }}
            >
              Open {z.title}
            </button>
          ))}
        </div>
      </div>
      <ViewControls view={view} onChange={setView} onLive={setLive} />
    </>
  );
}
