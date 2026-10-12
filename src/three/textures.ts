import * as THREE from 'three';
import type { ZoneKey } from '../types';

/** Palette shared with `global.css`. */
export const COLORS = {
  navy800: '#10264a',
  blue600: '#1e4d8c',
  blue400: '#7fb2f0',
  blue200: '#c9ddf5',
  orange: '#ff7a3d',
  wallBack: '#16386a',
  wallWest: '#163f78',
} as const;

export const FONT_SANS = "'Space Grotesk', system-ui, sans-serif";
export const FONT_MONO = "'IBM Plex Mono', ui-monospace, monospace";

/** Every font face the canvas artwork uses; they must be loaded before it is drawn. */
export const FONT_FACES = [
  "10px 'IBM Plex Mono'",
  "600 13px 'IBM Plex Mono'",
  "700 21px 'Space Grotesk'",
  "13px 'Space Grotesk'",
];

type Ctx = CanvasRenderingContext2D;

/** A canvas `scale`× larger than its CSS-px size, already scaled so drawing code works in CSS px. */
export function makeCanvas(width: number, height: number, scale: number): [HTMLCanvasElement, Ctx] {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext('2d')!;
  ctx.scale(canvas.width / width, canvas.height / height);
  return [canvas, ctx];
}

/** Texture set up for flat artwork seen at a slant: mipmaps plus the best anisotropic filtering. */
export function artTexture(canvas: HTMLCanvasElement, maxAnisotropy: number): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = maxAnisotropy;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  return tex;
}

/** CSS `linear-gradient(<angle>, …)` across a w × h box. */
function cssGradient(ctx: Ctx, w: number, h: number, angleDeg: number, stops: [number, string][]): CanvasGradient {
  const a = (angleDeg * Math.PI) / 180;
  const dx = Math.sin(a);
  const dy = -Math.cos(a);
  const half = (Math.abs(w * dx) + Math.abs(h * dy)) / 2;
  const g = ctx.createLinearGradient(w / 2 - dx * half, h / 2 - dy * half, w / 2 + dx * half, h / 2 + dy * half);
  for (const [at, color] of stops) g.addColorStop(at, color);
  return g;
}

const spaced = (ctx: Ctx, em: number, px: number) => {
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${em * px}px`;
};

/** Padding between a top face's edge and its sketch, and the top of the first element under the label. */
const PAD = 14;
const TOP = 37.3;

/**
 * The wireframe sketch on a zone's top face — a miniature of what its sheet
 * holds. Drawn in the face's own px, measured from inside its 1.5px border.
 */
function drawSketch(ctx: Ctx, key: ZoneKey, label: string, raised: boolean): void {
  const line = raised ? 'rgba(242, 239, 230, 0.75)' : 'rgba(201, 221, 245, 0.45)';
  const bar = (x: number, y: number, w: number, h: number, fill: string = line) => {
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
  };

  ctx.fillStyle = raised ? '#fff' : COLORS.blue200;
  ctx.font = `${raised ? 600 : 400} 13px ${FONT_MONO}`;
  spaced(ctx, 0.16, 13);
  ctx.fillText(label, PAD, key === 'contact' ? 35.4 : PAD + 12);
  spaced(ctx, 0, 0);

  switch (key) {
    case 'about': // text lines and two buttons
      bar(PAD, TOP, 314, 14);
      bar(PAD, TOP + 23, 233, 14);
      bar(PAD, TOP + 46, 359, 7);
      bar(PAD, TOP + 62, 287, 7);
      bar(PAD, TOP + 84, 80, 18, COLORS.orange);
      bar(PAD + 88, TOP + 84, 80, 18);
      break;

    case 'experience': // 3 × 2 grid of role cards, one highlighted
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 6; i++) {
        const x = PAD + 0.75 + (i % 3) * 87;
        const y = TOP + 1.45 + Math.floor(i / 3) * 42;
        if (i === 4) bar(x, y, 77.5, 32.5, 'rgba(255, 122, 61, 0.3)');
        ctx.strokeStyle = i === 4 ? COLORS.orange : 'rgba(201, 221, 245, 0.7)';
        ctx.strokeRect(x, y, 77.5, 32.5);
      }
      bar(PAD, TOP + 85.7, 152, 7);
      break;

    case 'education': // one degree card: title, underline, course chips, stamp
      bar(PAD, TOP, 212, 12);
      bar(PAD, TOP + 20, 98, 3, COLORS.orange);
      [46, 34, 52, 38].forEach((w, i) => bar(PAD + [0, 54, 96, 156][i]!, TOP + 31, w, 11));
      ctx.save();
      ctx.translate(328, 58.3);
      ctx.rotate((-8 * Math.PI) / 180);
      bar(-36, -16, 72, 32, 'rgba(255, 122, 61, 0.14)');
      ctx.strokeStyle = COLORS.orange;
      ctx.lineWidth = 2;
      ctx.strokeRect(-36, -16, 72, 32);
      bar(-23, -2.5, 46, 5, COLORS.orange);
      ctx.restore();
      break;

    case 'skills': // three progress bars
      [80, 60, 40].forEach((pct, i) => {
        bar(PAD, TOP + i * 16, 3.23 * pct, 7, COLORS.orange);
        bar(PAD + 3.23 * pct, TOP + i * 16, 3.23 * (100 - pct), 7, 'rgba(201, 221, 245, 0.3)');
      });
      break;

    case 'contact': // a line on the left, buttons on the right
      bar(PAD, 45.7, 220, 12);
      bar(517, 29.5, 110, 22, COLORS.orange);
      bar(635, 29.5, 60, 22);
      bar(703, 29.5, 60, 22);
      break;
  }
}

/** Top face of a zone: gradient, bevel, sketch and border, at rest or raised. */
export function drawTop(ctx: Ctx, w: number, h: number, key: ZoneKey, label: string, raised: boolean): void {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = cssGradient(
    ctx,
    w,
    h,
    135,
    raised
      ? [[0, '#2a5a9c'], [0.6, '#1f4a86'], [1, '#1a3f74']]
      : [[0, '#1c3e70'], [0.6, '#16325c'], [1, '#132b50']],
  );
  ctx.fillRect(0, 0, w, h);

  // Bevel just inside the border: light on the top/left, dark on the bottom/right.
  ctx.fillStyle = raised ? 'rgba(255, 200, 170, 0.4)' : 'rgba(242, 239, 230, 0.28)';
  ctx.fillRect(1.5, 1.5, w - 3, 1);
  ctx.fillRect(1.5, 1.5, 1, h - 3);
  ctx.fillStyle = raised ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.28)';
  ctx.fillRect(1.5, h - 3.5, w - 3, 2);
  ctx.fillRect(w - 3.5, 1.5, 2, h - 3);

  ctx.save();
  ctx.translate(1.5, 1.5);
  drawSketch(ctx, key, label, raised);
  ctx.restore();

  ctx.strokeStyle = raised ? COLORS.orange : COLORS.blue200;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(0.75, 0.75, w - 1.5, h - 1.5);
}

/**
 * A wall that faces the viewer: hatch lines over a base colour with a shade
 * from foot to top. `riseAlongX` says which canvas axis is the wall's height.
 */
export function drawWall(ctx: Ctx, w: number, h: number, base: string, riseAlongX: boolean, light: number, dark: number, hatch: number): void {
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = `rgba(201, 221, 245, ${hatch})`;
  if (riseAlongX) for (let y = 0; y < h; y += 18) ctx.fillRect(0, y, w, 1);
  else for (let x = 0; x < w; x += 18) ctx.fillRect(x, 0, 1, h);
  // Light at the foot, dark at the top.
  const g = riseAlongX ? ctx.createLinearGradient(0, 0, w, 0) : ctx.createLinearGradient(0, h, 0, 0);
  g.addColorStop(0, `rgba(255, 255, 255, ${light})`);
  g.addColorStop(1, `rgba(0, 0, 0, ${dark})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/** A soft dark rectangle with `pad` px of blur around it, used as a drop shadow. */
export function drawShadow(ctx: Ctx, w: number, h: number, pad: number, blur: number, color: string): void {
  ctx.clearRect(0, 0, w + pad * 2, h + pad * 2);
  ctx.save();
  // Draw the rectangle off-canvas and keep only its blurred shadow.
  const far = 4096;
  ctx.shadowColor = color;
  ctx.shadowBlur = blur * ctx.getTransform().a;
  ctx.shadowOffsetX = far * ctx.getTransform().a;
  ctx.fillStyle = '#000';
  ctx.fillRect(pad - far, pad, w, h);
  ctx.restore();
}

/**
 * The flat drawing on the board: grid, the sketched browser window (frame,
 * title bar, address bar, nav) and the two dimension lines with the live
 * viewport size. Coordinates are board px (900 × 600), measured from inside
 * its 2px border — the same origin the zones use.
 */
export function drawBoard(ctx: Ctx, host: string, viewportWidth: number, viewportHeight: number): void {
  ctx.fillStyle = COLORS.navy800;
  ctx.fillRect(0, 0, 900, 600);
  ctx.save();
  ctx.translate(2, 2);

  const stroke = (color: string, width: number, path: () => void) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    path();
    ctx.stroke();
  };
  const grid = (step: number, alpha: number) =>
    stroke(`rgba(127, 178, 240, ${alpha})`, 1, () => {
      for (let x = 0.5; x < 896; x += step) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 596);
      }
      for (let y = 0.5; y < 596; y += step) {
        ctx.moveTo(0, y);
        ctx.lineTo(896, y);
      }
    });
  grid(20, 0.08);
  grid(100, 0.22);
  stroke(COLORS.blue200, 2, () => ctx.rect(-1, -1, 898, 598));

  // Dimension lines: width along the bottom, height up the left side.
  stroke(COLORS.orange, 1, () => {
    const seg = (x1: number, y1: number, x2: number, y2: number) => {
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    };
    seg(40, 581.5, 856, 581.5);
    seg(40.5, 576, 40.5, 587);
    seg(855.5, 576, 855.5, 587);
    seg(14.5, 40, 14.5, 556);
    seg(9, 40.5, 20, 40.5);
    seg(9, 555.5, 20, 555.5);
  });
  const label = (x: number, y: number, text: string, turn: number) => {
    const width = text.length * 6.6 + 16;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(turn);
    ctx.fillStyle = COLORS.navy800; // interrupts the line behind the text
    ctx.fillRect(-width / 2, -7, width, 14);
    ctx.fillStyle = COLORS.orange;
    ctx.font = `11px ${FONT_MONO}`;
    ctx.textAlign = 'center';
    ctx.fillText(text, 0, 4);
    ctx.restore();
  };
  label(448, 571, `${viewportWidth} PX`, 0);
  label(18, 298, `${viewportHeight} PX`, Math.PI / 2);

  // Browser window: frame, title bar with three lights, address bar.
  ctx.fillStyle = 'rgba(11, 26, 51, 0.55)';
  ctx.fillRect(40, 40, 820, 520);
  stroke(COLORS.blue200, 1.5, () => {
    ctx.rect(40.75, 40.75, 818.5, 518.5);
    ctx.moveTo(40, 73.25);
    ctx.lineTo(860, 73.25);
    for (const cx of [77, 95]) {
      ctx.moveTo(cx + 4.25, 56.25);
      ctx.arc(cx, 56.25, 4.25, 0, Math.PI * 2);
    }
  });
  ctx.fillStyle = COLORS.orange;
  ctx.beginPath();
  ctx.arc(59, 56.25, 5, 0, Math.PI * 2);
  ctx.fill();
  stroke('rgba(201, 221, 245, 0.6)', 1, () => ctx.rect(126.5, 48.75, 319, 15));
  ctx.fillStyle = COLORS.blue400;
  ctx.font = `10px ${FONT_MONO}`;
  ctx.fillText(`https://${host}`, 135, 59.7);

  // Page nav: dashed outline, logo, four links.
  ctx.setLineDash([3, 3]);
  stroke('rgba(201, 221, 245, 0.6)', 1, () => ctx.rect(60.5, 88.5, 779, 29));
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(201, 221, 245, 0.6)';
  ctx.fillRect(73, 99, 90, 8);
  ctx.fillStyle = 'rgba(201, 221, 245, 0.45)';
  for (let i = 0; i < 3; i++) ctx.fillRect(609 + i * 58, 100, 44, 6);
  ctx.fillStyle = COLORS.orange;
  ctx.fillRect(783, 100, 44, 6);

  ctx.restore();
}

export interface HoloCard {
  canvas: HTMLCanvasElement;
  /** Size of the card itself and of the glow margin around it, in px. */
  width: number;
  height: number;
  margin: number;
}

/** The hologram card shown above a hovered zone. */
export function drawHoloCard(title: string, sub: string, scale: number): HoloCard {
  const probe = document.createElement('canvas').getContext('2d')!;
  probe.font = `600 11px ${FONT_MONO}`;
  spaced(probe, 0.2, 11);
  const wKicker = probe.measureText('→ OPEN').width;
  spaced(probe, 0, 0);
  probe.font = `700 21px ${FONT_SANS}`;
  const wTitle = probe.measureText(title).width;
  probe.font = `13px ${FONT_SANS}`;
  const wSub = probe.measureText(sub).width;

  const width = Math.ceil(Math.max(wKicker, wTitle, wSub)) + 36;
  const height = 92;
  const margin = 26;
  const [canvas, ctx] = makeCanvas(width + margin * 2, height + margin * 2, scale);
  ctx.translate(margin, margin);

  // Outer glow, then the glass.
  ctx.save();
  ctx.shadowColor = 'rgba(80, 200, 255, 0.45)';
  ctx.shadowBlur = 22 * scale;
  ctx.fillStyle = 'rgba(10, 44, 82, 0.9)';
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
  ctx.fillStyle = 'rgba(140, 230, 255, 0.13)';
  for (let y = 0; y < height; y += 3) ctx.fillRect(0, y, width, 1);
  const glass = ctx.createLinearGradient(0, 0, 0, height);
  glass.addColorStop(0, 'rgba(120, 220, 255, 0.16)');
  glass.addColorStop(1, 'rgba(40, 140, 220, 0.06)');
  ctx.fillStyle = glass;
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = 'rgba(140, 230, 255, 0.75)';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, width - 1, height - 1);

  ctx.textBaseline = 'alphabetic';
  ctx.shadowBlur = 8 * scale;
  ctx.shadowColor = 'rgba(120, 225, 255, 0.8)';
  ctx.fillStyle = '#8fe6ff';
  ctx.font = `600 11px ${FONT_MONO}`;
  spaced(ctx, 0.2, 11);
  ctx.fillText('→ OPEN', 18, 24);
  spaced(ctx, 0, 0);

  ctx.shadowBlur = 14 * scale;
  ctx.shadowColor = 'rgba(120, 225, 255, 0.75)';
  ctx.font = `700 21px ${FONT_SANS}`;
  // Slight colour split, like a misaligned projection.
  ctx.fillStyle = 'rgba(255, 90, 140, 0.55)';
  ctx.fillText(title, 17, 50);
  ctx.fillStyle = 'rgba(90, 230, 255, 0.8)';
  ctx.fillText(title, 19, 50);
  ctx.fillStyle = '#f0fdff';
  ctx.fillText(title, 18, 50);

  ctx.shadowBlur = 6 * scale;
  ctx.shadowColor = 'rgba(120, 225, 255, 0.6)';
  ctx.fillStyle = '#a9e9ff';
  ctx.font = `13px ${FONT_SANS}`;
  ctx.fillText(sub, 18, 73);

  return { canvas, width, height, margin };
}

/** Projector beam under the hologram: wide at the card, a point at the zone. */
export function drawBeam(scale: number): HTMLCanvasElement {
  const [canvas, ctx] = makeCanvas(190, 80, scale);
  const g = ctx.createLinearGradient(0, 80, 0, 0);
  g.addColorStop(0, 'rgba(140, 230, 255, 0.55)');
  g.addColorStop(0.55, 'rgba(90, 200, 255, 0.18)');
  g.addColorStop(1, 'rgba(90, 200, 255, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(190, 0);
  ctx.lineTo(190 * 0.53, 80);
  ctx.lineTo(190 * 0.47, 80);
  ctx.closePath();
  ctx.fill();
  return canvas;
}

/** A soft horizontal band, swept down the hologram as a scan line. */
export function drawScanBand(): HTMLCanvasElement {
  const [canvas, ctx] = makeCanvas(4, 64, 1);
  const g = ctx.createLinearGradient(0, 0, 0, 64);
  g.addColorStop(0, 'rgba(160, 240, 255, 0)');
  g.addColorStop(0.5, 'rgba(160, 240, 255, 0.28)');
  g.addColorStop(1, 'rgba(160, 240, 255, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 64);
  return canvas;
}
