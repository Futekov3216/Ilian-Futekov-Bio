# Blueprint CV — Ilian Futekov

An interactive CV presented as a 3D architectural blueprint. Hover a zone and it
rises off the sheet with a hologram label; click it and the camera leans in and
the zone's sheet unfolds.

Built with **React 19 + TypeScript + Vite**. No UI framework or animation library:
the 3D is pure CSS transforms, and the sequencing is a small state hook.

## Getting started

Requires Node.js 20.19+ (or 22.12+).

```bash
npm install
npm run dev        # http://localhost:5173
```

| Script              | What it does                                   |
| ------------------- | ---------------------------------------------- |
| `npm run dev`       | Dev server with hot reload                     |
| `npm run build`     | Type-check, then build to `docs/`              |
| `npm run preview`   | Serve the production build locally             |
| `npm run typecheck` | TypeScript only                                |
| `npm run lint`      | ESLint (TypeScript + React Hooks rules)        |

## Editing the content

All text lives in **`src/data/cv.ts`**: profile, roles, education, skill groups,
contact links, and the zone layout. Components only read from it.

## Project structure

```
src/
  data/cv.ts                 CV content + zone positions on the 900×600 plan
  types.ts                   Shared types (ZoneKey, Role, …)
  App.tsx                    Root: wires the controller, keyboard, overlays
  hooks/
    useSheetController.ts    open → reading → closing state machine + timings
    usePlanView.ts           Pan/zoom state for small screens
    useElementSize.ts        ResizeObserver for the stage (camera maths)
    useViewportWidth.ts      Live size for the "#### PX" dimension labels
  lib/camera.ts              Where the camera goes for a zone
  three/
    BlueprintScene.ts        The three.js scene: board, zone blocks, holograms, camera
    textures.ts              All artwork, drawn in code onto canvas textures
  components/
    Blueprint.tsx            WebGL canvas + pointer input, bridges React and the scene
    Spinner.tsx              Shown until the blueprint is ready
    ViewControls.tsx         Zoom slider + joystick (small screens)
    Sheet.tsx                Unfolding sheet chrome (bar, body, prev/next)
    sheets/*.tsx             About, Experience, Education, Skills, Contact
    Header.tsx, MobileNav.tsx, Reticle.tsx
  styles/global.css          Palette, keyframes, sheets, controls, responsive rules
```

See `HOW-IT-WORKS.md` for the full behaviour and animation reference.

## How the animation works

- **Blueprint**: a three.js (WebGL) scene. Each zone is a box that rests as a
  14px slab and rises to its full height on hover/focus; the zone under the
  pointer is found by ray-casting. The scene loads as a separate chunk behind a
  spinner and fades in once its fonts and textures are ready.
- **Camera**: `lib/camera.ts` works out the scale and centre for a zone; the
  scene undoes the plan's 50°/−30° tilt so the zone faces the viewer and fills
  the stage.
- **Sequencing**: `useSheetController` reveals the sheet 520ms into the zoom; for
  prev/next it folds the sheet (760ms), lets the camera travel (1300ms), then
  reopens. Keep those numbers in sync with the CSS and `BlueprintScene.ts` if
  you change durations.
- **Reduced motion** is respected via `prefers-reduced-motion`.

## Controls

- Mouse: hover to raise, click to open, click outside the sheet to close.
- Keyboard: Tab to a zone, Enter to open, ← / → to switch sheets, Esc to close.
- Phones / short landscape: a bottom navigation bar, plus a zoom slider, a
  joystick and drag-to-pan for exploring the plan and tapping a zone.

## Deploying

`vite.config.ts` uses `base: './'`, so `docs/` works from any path, including
GitHub Pages project sites. A ready workflow is in
`.github/workflows/deploy.yml`: push to `main`, then in the repo settings set
**Pages → Source → GitHub Actions**.
