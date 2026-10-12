import * as THREE from 'three';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { PLANE_H, PLANE_W } from '../lib/camera';
import { HOME, type View } from '../lib/view';
import type { ZoneKey, ZoneMeta } from '../types';
import { COLORS, FONT_FACES, artTexture, drawBeam, drawBoard, drawHoloCard, drawScanBand, drawShadow, drawTop, drawWall, makeCanvas } from './textures';

/**
 * The blueprint as a WebGL scene: a tilted board carrying five zone blocks that
 * rise on hover, with a camera that leans in on one of them. All artwork is
 * drawn in code onto canvas textures (see `textures.ts`), so nothing but the
 * web fonts has to download before it can appear.
 *
 * Lengths are "stage px", the unit of the surrounding CSS layout. Coordinates:
 * x right, y up, z towards the viewer. Zone rects and camera targets come in
 * page coordinates (y down), hence the sign flips where they are applied.
 */

const DEG = Math.PI / 180;
/** Camera distance. A long one keeps the perspective mild, so blocks on the left and right look alike. */
const DISTANCE = 4000;
const TILT_X = 50;
const TILT_Z = -30;
/** Resting slab thickness and the three rise heights (`ZoneMeta.height`). */
const SLAB = 14;
const RISE = { a: 72, b: 52, c: 96 } as const;
/** Timings (s). `CAMERA_MOVE` must match the waits in `useSheetController`. */
const SCENE_IN = 1.8;
const SWAY_PERIOD = 14;
const CAMERA_MOVE = 1.25;
const RISE_IN = 0.6;
const RISE_OUT = 0.45;
const TINT = 0.4;
const WAVE = 1.4;
/** Resolution of the canvas artwork relative to stage px. */
const ART_SCALE = 4;

type Ease = (x: number) => number;

/** A `cubic-bezier()` easing curve as a function. */
function bezier(x1: number, y1: number, x2: number, y2: number): Ease {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const slope = (3 * ax * t + 2 * bx) * t + cx;
      if (Math.abs(slope) < 1e-6) break;
      t -= (((ax * t + bx) * t + cx) * t - x) / slope;
    }
    return ((ay * t + by) * t + cy) * t;
  };
}

const EASE_SCENE = bezier(0.2, 0.8, 0.2, 1);
const EASE_CAMERA = bezier(0.7, 0, 0.2, 1);
const EASE_RISE_IN = bezier(0.2, 0.9, 0.25, 1.15);
const EASE_RISE_OUT = bezier(0.3, 0.7, 0.3, 1);
const EASE_IN_OUT = bezier(0.42, 0, 0.58, 1);
const EASE = bezier(0.25, 0.1, 0.25, 1);

/** A value gliding from one number to another over a set time. */
class Glide {
  private from: number;
  private to: number;
  private start = 0;
  private duration = 0;
  private ease: Ease = EASE;

  constructor(value: number) {
    this.from = value;
    this.to = value;
  }

  get target(): number {
    return this.to;
  }

  at(now: number): number {
    if (this.duration <= 0) return this.to;
    return this.from + (this.to - this.from) * this.ease((now - this.start) / this.duration);
  }

  go(to: number, now: number, duration: number, ease: Ease): void {
    if (to === this.to) return;
    this.from = this.at(now);
    this.to = to;
    this.start = now;
    this.duration = duration;
    this.ease = ease;
  }
}

/** Piecewise-linear lookup over `[time, value]` keyframes. */
function keyframes(frames: [number, number][], t: number): number {
  if (t <= frames[0]![0]) return frames[0]![1];
  for (let i = 1; i < frames.length; i++) {
    const [t1, v1] = frames[i]!;
    if (t <= t1) {
      const [t0, v0] = frames[i - 1]!;
      return v0 + ((v1 - v0) * (t - t0)) / (t1 - t0);
    }
  }
  return frames[frames.length - 1]![1];
}

interface Zone {
  meta: ZoneMeta;
  /** Full rise height and the resting fraction of it. */
  rise: number;
  rest: number;
  group: THREE.Group;
  box: THREE.Mesh;
  raisedTop: THREE.Mesh;
  edges: LineSegments2;
  shadow: THREE.Mesh;
  /** How far the block has risen (rest … 1) and how far its colours have turned (0 … 1). */
  height: Glide;
  tint: Glide;
  holo: Hologram | null;
  /** When the hologram last started to show or hide. */
  holoSince: number;
  holoOn: boolean;
}

interface Hologram {
  anchor: THREE.Group;
  card: THREE.Mesh;
  scan: THREE.Mesh;
  beam: THREE.Mesh;
  cardHeight: number;
}

export interface SceneLayout {
  /** Stage size in stage px. */
  width: number;
  height: number;
  /** Extra canvas above the stage, so the plan and holograms can rise over the header. */
  extraTop: number;
  /** How far the plan sits above the stage centre (half the stage's bottom padding). */
  lift: number;
  /** Drawing-buffer pixels per stage px. */
  pixelRatio: number;
}

export interface CameraTarget {
  scale: number;
  cx: number;
  cy: number;
}

export class BlueprintScene {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera();
  private readonly raycaster = new THREE.Raycaster();

  // Each motion owns its own group, outermost first, so they never fight over one transform.
  private readonly root = new THREE.Group(); // stage centre + lift
  private readonly camScale = new THREE.Group(); // camera: magnify
  private readonly camMove = new THREE.Group(); // camera: centre on a zone
  private readonly camRotZ = new THREE.Group(); // camera: undo the turn
  private readonly camRotX = new THREE.Group(); // camera: undo the tilt
  private readonly tiltX = new THREE.Group(); // resting tilt
  private readonly tiltZ = new THREE.Group(); // resting turn + intro scale
  private readonly swayX = new THREE.Group(); // idle sway
  private readonly swayZ = new THREE.Group();
  private readonly board = new THREE.Group(); // the 900 × 600 plan

  private readonly zones: Zone[] = [];
  private readonly lines: LineMaterial[] = [];
  private readonly disposables: { dispose(): void }[] = [];
  /** Jobs that (re)paint the canvas textures; run once the fonts are in. */
  private readonly painters: (() => void)[] = [];
  private readonly reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  private readonly host: string;
  /** The scene's clock starts when it is ready, so the intro plays from its first visible frame. */
  private t0 = performance.now();
  private ready = false;

  private boardCanvas: HTMLCanvasElement;
  private boardCtx: CanvasRenderingContext2D;
  private boardTexture: THREE.CanvasTexture;
  private viewport = { width: 0, height: 0 };

  private layout: SceneLayout = { width: 1200, height: 640, extraTop: 0, lift: 0, pixelRatio: 1 };
  private camS = new Glide(1);
  private camX = new Glide(0);
  private camY = new Glide(0);
  /** 0 = tilted plan view, 1 = facing the viewer. */
  private camFlat = new Glide(0);
  private swayGain = 1;
  private view: View = HOME;
  private viewShown: View = HOME;
  private viewLive = false;
  private active: ZoneKey | null = null;
  private hover: ZoneKey | null = null;
  private lastTime = 0;
  private frameId = 0;
  private disposed = false;

  /**
   * @param host    printed in the sketched address bar
   * @param onReady called once the fonts are loaded and the first frame is drawn
   */
  constructor(canvas: HTMLCanvasElement, zones: ZoneMeta[], host: string, onReady: () => void) {
    this.host = host;
    // Blend in sRGB like the browser does, so translucent layers match the page's CSS colours.
    THREE.ColorManagement.enabled = false;
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    this.renderer.setClearColor(0x000000, 0);

    this.scene.add(this.root);
    this.root.add(this.camScale);
    this.camScale.add(this.camMove);
    this.camMove.add(this.camRotZ);
    this.camRotZ.add(this.camRotX);
    this.camRotX.add(this.tiltX);
    this.tiltX.add(this.tiltZ);
    this.tiltZ.add(this.swayX);
    this.swayX.add(this.swayZ);
    this.swayZ.add(this.board);

    this.camera.position.set(0, 0, DISTANCE);

    [this.boardCanvas, this.boardCtx] = makeCanvas(PLANE_W, PLANE_H, ART_SCALE);
    this.boardTexture = artTexture(this.boardCanvas, this.renderer.capabilities.getMaxAnisotropy());
    this.buildBoard();
    for (const meta of zones) this.zones.push(this.buildZone(meta));

    this.frame = this.frame.bind(this);
    this.prepare(onReady);
  }

  // ---- Public API ---------------------------------------------------------

  setLayout(layout: SceneLayout): void {
    this.layout = layout;
    this.renderer.setPixelRatio(layout.pixelRatio);
    this.renderer.setSize(layout.width, layout.height + layout.extraTop, false);
    for (const m of this.lines) m.resolution.set(layout.width, layout.height + layout.extraTop);
  }

  /** Lean in on a zone (`target`), or pull back to the plan (`null`). */
  setCamera(target: CameraTarget | null): void {
    const now = this.now();
    const d = this.reduced ? 0 : CAMERA_MOVE;
    this.camS.go(target?.scale ?? 1, now, d, EASE_CAMERA);
    this.camX.go(target?.cx ?? 0, now, d, EASE_CAMERA);
    this.camY.go(target?.cy ?? 0, now, d, EASE_CAMERA);
    this.camFlat.go(target ? 1 : 0, now, d, EASE_CAMERA);
  }

  /** The zone whose sheet is open: it stays raised, and holograms are hidden. */
  setActive(key: ZoneKey | null): void {
    this.active = key;
    this.retarget();
  }

  setHover(key: ZoneKey | null): void {
    if (key === this.hover) return;
    this.hover = key;
    this.retarget();
  }

  /** The visitor's own pan/zoom. `live` = being dragged, so follow without easing. */
  setView(view: View, live: boolean): void {
    this.view = view;
    this.viewLive = live;
  }

  setViewport(width: number, height: number): void {
    this.viewport = { width, height };
    if (this.ready) this.paintBoard();
  }

  /** The zone under a point given in normalised device coordinates (-1 … 1), if any. */
  pick(ndcX: number, ndcY: number): ZoneKey | null {
    this.raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera);
    const hit = this.raycaster.intersectObjects(this.zones.map((z) => z.box), false)[0];
    return hit ? (hit.object.userData.key as ZoneKey) : null;
  }

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    for (const d of this.disposables) d.dispose();
    this.renderer.dispose();
  }

  // ---- Construction -------------------------------------------------------

  private keep<T extends { dispose(): void }>(thing: T): T {
    this.disposables.push(thing);
    return thing;
  }

  private line(positions: number[] | Float32Array, order: number): LineSegments2 {
    const geometry = this.keep(new LineSegmentsGeometry());
    geometry.setPositions(positions);
    const material = this.keep(new LineMaterial({ color: COLORS.blue200, linewidth: 1.5 }));
    this.lines.push(material);
    const line = new LineSegments2(geometry, material);
    line.renderOrder = order;
    return line;
  }

  private shadowMesh(w: number, h: number, pad: number, blur: number, color: string): THREE.Mesh {
    const [canvas, ctx] = makeCanvas(w + pad * 2, h + pad * 2, 0.5);
    drawShadow(ctx, w, h, pad, blur, color);
    const map = this.keep(new THREE.CanvasTexture(canvas));
    const mesh = new THREE.Mesh(
      this.keep(new THREE.PlaneGeometry(w + pad * 2, h + pad * 2)),
      this.keep(new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false })),
    );
    mesh.renderOrder = 1;
    return mesh;
  }

  private buildBoard(): void {
    this.keep(this.boardTexture);
    const sheet = new THREE.Mesh(
      this.keep(new THREE.PlaneGeometry(PLANE_W, PLANE_H)),
      this.keep(new THREE.MeshBasicMaterial({ map: this.boardTexture })),
    );
    const shadow = this.shadowMesh(PLANE_W, PLANE_H, 200, 120, 'rgba(0, 0, 0, 0.45)');
    shadow.position.set(0, -60, -2);
    shadow.renderOrder = -1;
    this.board.add(shadow, sheet);
    this.painters.push(() => this.paintBoard());
  }

  private paintBoard(): void {
    drawBoard(this.boardCtx, this.host, this.viewport.width, this.viewport.height);
    this.boardTexture.needsUpdate = true;
  }

  private buildZone(meta: ZoneMeta): Zone {
    const { w, h } = meta.rect;
    const rise = RISE[meta.height];
    const rest = SLAB / rise;
    const anisotropy = this.renderer.capabilities.getMaxAnisotropy();

    const group = new THREE.Group();
    // Zone rects are measured from inside the board's 2px border.
    group.position.set(2 + meta.rect.x + w / 2 - PLANE_W / 2, -(2 + meta.rect.y + h / 2 - PLANE_H / 2), 0);

    // Walls and top: a unit-deep box, stretched to the current height each frame.
    const wall = (width: number, height: number, base: string, riseAlongX: boolean, light: number, dark: number, hatch: number) => {
      const [canvas, ctx] = makeCanvas(width, height, 2);
      drawWall(ctx, width, height, base, riseAlongX, light, dark, hatch);
      return this.keep(new THREE.MeshBasicMaterial({ map: this.keep(artTexture(canvas, anisotropy)), ...BEHIND_LINES }));
    };
    const back = this.keep(new THREE.MeshBasicMaterial({ color: COLORS.wallBack, ...BEHIND_LINES }));
    const [restCanvas, restCtx] = makeCanvas(w, h, ART_SCALE);
    const [raisedCanvas, raisedCtx] = makeCanvas(w, h, ART_SCALE);
    const restTexture = this.keep(artTexture(restCanvas, anisotropy));
    const raisedTexture = this.keep(artTexture(raisedCanvas, anisotropy));
    this.painters.push(() => {
      drawTop(restCtx, w, h, meta.key, meta.label, false);
      drawTop(raisedCtx, w, h, meta.key, meta.label, true);
      restTexture.needsUpdate = true;
      raisedTexture.needsUpdate = true;
    });

    const box = new THREE.Mesh(this.keep(new THREE.BoxGeometry(w, h, 1)), [
      back, // east
      wall(rise, h, COLORS.wallWest, true, 0.1, 0.3, 0.18), // west
      back, // north
      wall(w, rise, COLORS.blue600, false, 0.14, 0.25, 0.22), // south
      this.keep(new THREE.MeshBasicMaterial({ map: restTexture, ...BEHIND_LINES })), // top
      back, // underside
    ]);
    box.userData.key = meta.key;

    // The raised look of the top face, faded in over the resting one.
    const raisedTop = new THREE.Mesh(
      this.keep(new THREE.PlaneGeometry(w, h)),
      this.keep(new THREE.MeshBasicMaterial({ map: raisedTexture, transparent: true, opacity: 0, depthWrite: false })),
    );
    raisedTop.renderOrder = 3;

    const edgeGeometry = new THREE.EdgesGeometry(box.geometry);
    const edges = this.line(edgeGeometry.getAttribute('position').array as Float32Array, 4);
    edgeGeometry.dispose();

    // Foundation: the box's own bottom edges outline the footprint; only a drop shadow reaches past it.
    const shadow = this.shadowMesh(w, h, 70, 32, 'rgba(2, 6, 16, 1)');
    shadow.position.z = 0.4;

    group.add(shadow, box, raisedTop, edges);
    this.board.add(group);

    return {
      meta,
      rise,
      rest,
      group,
      box,
      raisedTop,
      edges,
      shadow,
      height: new Glide(rest),
      tint: new Glide(0),
      holo: null,
      holoSince: -10,
      holoOn: false,
    };
  }

  private buildHologram(zone: Zone): Hologram {
    const card = drawHoloCard(zone.meta.tipTitle, zone.meta.tipSub, 3);
    const transparent = { transparent: true, depthTest: false, depthWrite: false } as const;
    const fullW = card.width + card.margin * 2;
    const fullH = card.height + card.margin * 2;

    const anchor = new THREE.Group();
    const cardMesh = new THREE.Mesh(
      this.keep(new THREE.PlaneGeometry(fullW, fullH)),
      this.keep(new THREE.MeshBasicMaterial({ map: this.keep(new THREE.CanvasTexture(card.canvas)), ...transparent })),
    );
    const scanMap = this.keep(new THREE.CanvasTexture(drawScanBand()));
    scanMap.repeat.y = 1 / 0.38; // the band covers 38% of the card
    const scan = new THREE.Mesh(
      this.keep(new THREE.PlaneGeometry(card.width, card.height)),
      this.keep(new THREE.MeshBasicMaterial({ map: scanMap, blending: THREE.AdditiveBlending, ...transparent })),
    );
    const beam = new THREE.Mesh(
      this.keep(new THREE.PlaneGeometry(190, 80)),
      this.keep(new THREE.MeshBasicMaterial({ map: this.keep(new THREE.CanvasTexture(drawBeam(2))), ...transparent })),
    );
    // The card floats 78px above its anchor, with the beam filling the gap.
    cardMesh.position.y = 78 + card.height / 2;
    scan.position.y = cardMesh.position.y;
    beam.position.y = 40;
    for (const m of [beam, cardMesh, scan]) m.renderOrder = 10;
    anchor.add(beam, cardMesh, scan);
    anchor.visible = false;
    zone.group.add(anchor);
    return { anchor, card: cardMesh, scan, beam, cardHeight: card.height };
  }

  /**
   * Waits for the web fonts (canvas text can't be drawn without them), paints
   * every texture, then starts the clock and the render loop.
   */
  private prepare(onReady: () => void): void {
    const fonts = Promise.all(FONT_FACES.map((face) => document.fonts.load(face)));
    // Don't hold the page hostage to a font that never arrives.
    const giveUp = new Promise((resolve) => setTimeout(resolve, 4000));
    const start = () => {
      if (this.disposed) return;
      for (const paint of this.painters) paint();
      for (const zone of this.zones) zone.holo = this.buildHologram(zone);
      this.t0 = performance.now();
      this.lastTime = 0;
      this.ready = true;
      this.frame();
      onReady();
    };
    Promise.race([fonts, giveUp]).then(start, start);
  }

  // ---- Per-frame ----------------------------------------------------------

  private now(): number {
    return (performance.now() - this.t0) / 1000;
  }

  /** Points every zone's height and colour at where the current hover/active state wants them. */
  private retarget(): void {
    const now = this.now();
    for (const zone of this.zones) {
      const up = zone.meta.key === this.active || (zone.meta.key === this.hover && !this.active);
      if (up) zone.height.go(1, now, this.reduced ? 0 : RISE_IN, EASE_RISE_IN);
      else zone.height.go(zone.rest, now, this.reduced ? 0 : RISE_OUT, EASE_RISE_OUT);
      zone.tint.go(up ? 1 : 0, now, this.reduced ? 0 : TINT, EASE);

      const holoOn = zone.meta.key === this.hover && !this.active;
      if (holoOn !== zone.holoOn) {
        zone.holoOn = holoOn;
        zone.holoSince = now;
      }
    }
  }

  /** Off-axis projection: the eye sits a quarter of the stage above its centre, so the plan is seen slightly from above its middle. */
  private project(): void {
    const { width, height, extraTop } = this.layout;
    const { x, y, zoom } = this.viewShown;
    const eyeY = height / 4;
    // The window of the z = 0 plane that fills the canvas, after the visitor's pan/zoom.
    const left = (-width / 2 - x) / zoom;
    const right = (width / 2 - x) / zoom;
    const top = (height / 2 + extraTop + y) / zoom;
    const bottom = (-height / 2 + y) / zoom;
    const near = 200;
    const k = near / DISTANCE;
    this.camera.position.set(0, eyeY, DISTANCE);
    this.camera.projectionMatrix.makePerspective(left * k, right * k, (top - eyeY) * k, (bottom - eyeY) * k, near, DISTANCE * 3);
    this.camera.projectionMatrixInverse.copy(this.camera.projectionMatrix).invert();
  }

  /** The intro rise wave: each zone lifts to full height and settles back. */
  private wave(zone: Zone, now: number): number {
    if (this.reduced) return zone.rest;
    const t = (now - SCENE_IN - zone.meta.introDelay) / WAVE;
    if (t <= 0 || t >= 1) return zone.rest;
    if (t < 0.45) return zone.rest + (1 - zone.rest) * EASE_RISE_OUT(t / 0.45);
    if (t <= 0.55) return 1;
    return 1 - (1 - zone.rest) * EASE_RISE_OUT((t - 0.55) / 0.45);
  }

  private frame(): void {
    if (this.disposed) return;
    this.frameId = requestAnimationFrame(this.frame);
    const now = this.now();
    const dt = Math.min(0.1, now - this.lastTime);
    this.lastTime = now;

    // Visitor's view: follow a drag exactly, otherwise ease towards it.
    const follow = this.viewLive || this.reduced ? 1 : Math.min(1, dt * 12);
    this.viewShown = {
      x: this.viewShown.x + (this.view.x - this.viewShown.x) * follow,
      y: this.viewShown.y + (this.view.y - this.viewShown.y) * follow,
      zoom: this.viewShown.zoom + (this.view.zoom - this.viewShown.zoom) * follow,
    };
    this.project();

    // Camera
    const flat = this.camFlat.at(now);
    const scale = this.camS.at(now);
    this.root.position.y = this.layout.lift;
    this.camScale.scale.setScalar(scale);
    this.camMove.position.set(-this.camX.at(now), this.camY.at(now), 0);
    this.camRotZ.rotation.z = TILT_Z * DEG * flat;
    this.camRotX.rotation.x = TILT_X * DEG * flat;

    // Intro swing into the tilt, then the idle sway, which rests while a zone is focused.
    const intro = this.reduced ? 1 : EASE_SCENE(now / SCENE_IN);
    this.tiltX.rotation.x = -TILT_X * DEG * intro;
    this.tiltZ.rotation.z = -TILT_Z * DEG * intro;
    this.tiltZ.scale.setScalar(0.82 + 0.18 * intro);
    this.swayGain += ((this.camFlat.target === 1 ? 0 : 1) - this.swayGain) * Math.min(1, dt * 5);
    let sway = 0;
    if (!this.reduced && now > SCENE_IN) {
      const phase = ((now - SCENE_IN) % SWAY_PERIOD) / SWAY_PERIOD;
      sway = EASE_IN_OUT(phase < 0.5 ? phase * 2 : 2 - phase * 2) * this.swayGain;
    }
    this.swayX.rotation.x = -3 * DEG * sway;
    this.swayZ.rotation.z = -5 * DEG * sway;

    // Borders are 1.5 stage px on the plan and grow with every zoom.
    const lineWidth = 1.5 * scale * this.viewShown.zoom * (0.82 + 0.18 * intro);
    for (const zone of this.zones) this.updateZone(zone, now, lineWidth);

    this.renderer.render(this.scene, this.camera);
  }

  private updateZone(zone: Zone, now: number, lineWidth: number): void {
    const s = Math.max(zone.height.at(now), this.wave(zone, now));
    const tint = zone.tint.at(now);
    const z = zone.rise * s;

    zone.box.scale.z = z;
    zone.box.position.z = z / 2;
    zone.edges.scale.z = z;
    zone.edges.position.z = z / 2;
    zone.raisedTop.position.z = z + 0.2;
    (zone.raisedTop.material as THREE.MeshBasicMaterial).opacity = tint;
    zone.raisedTop.visible = tint > 0.001;

    zone.edges.material.linewidth = lineWidth;
    zone.edges.material.color.set(COLORS.blue200).lerp(ORANGE, tint);

    // The shadow slides out and darkens as the block rises.
    zone.shadow.position.x = 14 + 20 * tint;
    zone.shadow.position.y = -(18 + 26 * tint);
    zone.shadow.scale.setScalar(1 + 0.06 * tint);
    (zone.shadow.material as THREE.MeshBasicMaterial).opacity = 0.6 + 0.1 * tint;

    if (zone.holo) this.updateHologram(zone, zone.holo, now, z);
  }

  private updateHologram(zone: Zone, holo: Hologram, now: number, z: number): void {
    const age = now - zone.holoSince;
    let opacity: number;
    let stretch: number;
    let drop: number;
    if (zone.holoOn) {
      // Appear: a thin sliver stretches sideways, stutters twice and settles.
      const t = this.reduced ? 1 : Math.min(1, age / 0.7);
      opacity = keyframes([[0, 0], [0.35, 0.9], [0.55, 0.4], [0.62, 1], [0.7, 0.55], [0.78, 1], [1, 1]], t);
      stretch = keyframes([[0, 0.02], [0.35, 0.03], [0.62, 1.04], [1, 1]], t);
      drop = keyframes([[0, 10], [0.35, 0], [1, 0]], t);
      if (age > 0.7 && !this.reduced) {
        // Flicker: two brief dips every 3.5s.
        const f = ((age - 0.7) % 3.5) / 3.5;
        if (f > 0.47 && f < 0.49) opacity = 0.62;
        else if (f > 0.83 && f < 0.85) opacity = 0.45;
      }
    } else {
      const t = this.reduced ? 1 : Math.min(1, age / 0.25);
      opacity = 1 - t;
      stretch = 1 - 0.98 * t;
      drop = 10 * t;
    }

    holo.anchor.visible = opacity > 0.001;
    if (!holo.anchor.visible) return;

    // Stand upright facing the viewer, whatever the plan's tilt.
    holo.anchor.position.z = z + 6;
    zone.group.getWorldQuaternion(holo.anchor.quaternion).invert();
    holo.anchor.scale.set(stretch, 1, 1);
    holo.anchor.position.y = 0;
    holo.card.position.y = 78 + holo.cardHeight / 2 - drop;
    holo.scan.position.y = holo.card.position.y;

    (holo.card.material as THREE.MeshBasicMaterial).opacity = opacity;
    // Pulse the beam and sweep the scan band down the card.
    (holo.beam.material as THREE.MeshBasicMaterial).opacity = opacity * (0.875 - 0.125 * Math.cos((now / 1.6) * Math.PI * 2));
    const scan = holo.scan.material as THREE.MeshBasicMaterial;
    scan.opacity = opacity;
    const band = 1 / 0.38;
    scan.map!.offset.y = -band + ((now % 2.2) / 2.2) * (band + 1);
  }
}

const ORANGE = new THREE.Color(COLORS.orange);
/** Pushes faces slightly back in depth, so the edge lines drawn along them are not half-hidden. */
const BEHIND_LINES = { polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 2 } as const;
