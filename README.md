# dotwave

[![npm version](https://img.shields.io/npm/v/dotwave)](https://www.npmjs.com/package/dotwave)
[![CI](https://github.com/Naaach/dotwave/actions/workflows/ci.yml/badge.svg)](https://github.com/Naaach/dotwave/actions/workflows/ci.yml)
[![Deploy](https://github.com/Naaach/dotwave/actions/workflows/pages.yml/badge.svg)](https://dotwave.nachodiaz.es)
[![MIT license](https://img.shields.io/badge/license-MIT-6ee7b7.svg)](LICENSE)

> A grid of dots that breathe, driven by 3D Simplex noise.
> Zero dependencies · TypeScript · ESM + CJS + CDN · ~5 KB gzipped · 60 fps at 4K.

**Playground** https://dotwave.nachodiaz.es · **Docs** https://dotwave.nachodiaz.es/docs/ · **npm** https://www.npmjs.com/package/dotwave

<p align="center">
  <img src="https://github.com/Naaach/dotwave/raw/main/docs/demo.png" alt="dotwave playground: the aurora preset with live controls, an fps counter and a rotated grid" width="840" />
</p>

Each dot's opacity and size come from a 3D noise field sampled at
`noise(x * noiseScale, y * noiseScale, elapsed * speed)`. That is what makes the
dots appear in organic waves that grow and fade instead of following a rigid
loop, and it is one small function call per dot per frame.

```ts
import { createDotWave } from "dotwave";

const wave = createDotWave({ container: "#hero", preset: "aurora", angle: 30 });

wave.updateOptions({ interactive: true });
wave.destroy();
```

---

## Install

```bash
npm install dotwave
# or
pnpm add dotwave
```

No runtime dependencies. Ship it as ESM, CJS, or straight from a CDN:

```html
<script src="https://unpkg.com/dotwave/dist/index.global.js"></script>
<script>
  DotWave.createDotWave({ preset: "ember" });
</script>
```

Types are included.

---

## Quick start

```ts
import { createDotWave } from "dotwave";

// A container element (or selector) to fill. Defaults to document.body.
const wave = createDotWave({
  container: "#hero",
  preset: "aurora",
  interactive: true,
  angle: 15,
});

// Live updates, no re-creation needed.
wave.updateOptions({ speed: 0.002, dotColor: "167, 139, 250" });

wave.pause();
wave.play();
wave.destroy();
```

Plain HTML, no build step:

```html
<script src="https://unpkg.com/dotwave/dist/index.global.js"></script>
<script>
  DotWave.createDotWave({ container: document.body, preset: "starfield" });
</script>
```

`pnpm demo` starts a Vite dev server with the full playground at
http://localhost:5173 and this documentation at http://localhost:5173/docs/.
The pages import the library source, so there is no build step while you work.

---

## Presets

Six ready-made looks. Anything you pass alongside `preset` wins over it.

| Preset      | Look                                                  |
| ----------- | ----------------------------------------------------- |
| `aurora`    | Slow mint clouds, reacts to the pointer      |
| `starfield` | Tiny crisp dots twinkling on near-black      |
| `nebula`    | Wide violet haze, very slow                  |
| `ember`     | Warm square embers drifting up               |
| `radar`     | Hollow rings on a grid tilted 15°            |
| `minimal`   | Almost invisible, for readable content on top |

<p align="center">
  <img src="https://github.com/Naaach/dotwave/raw/main/docs/preset-nebula.png" alt="nebula preset" width="270" />
  <img src="https://github.com/Naaach/dotwave/raw/main/docs/preset-ember.png" alt="ember preset" width="270" />
  <img src="https://github.com/Naaach/dotwave/raw/main/docs/preset-radar.png" alt="radar preset, rings on a tilted grid" width="270" />
  <img src="https://github.com/Naaach/dotwave/raw/main/docs/preset-starfield.png" alt="starfield preset" width="270" />
</p>

```ts
import { createDotWave, presets, presetNames } from "dotwave";

presetNames; // ["aurora", "starfield", "nebula", "ember", "radar", "minimal"]
presets.nebula;
```

---

## Options

Everything is optional. Invalid numbers are clamped instead of breaking the
render loop.

| Option              | Type                          | Default              | What it does                                                     |
| ------------------- | ----------------------------- | -------------------- | ---------------------------------------------------------------- |
| `container`         | `HTMLElement \| string`       | `document.body`      | Element or selector that hosts the canvas                          |
| `spacing`           | `number`                      | `22`                 | Distance between dots in px                                       |
| `dotRadius`         | `number`                      | `1.2`                | Base radius in px, minimum 1                                      |
| `dotColor`          | `string`                      | `"255, 255, 255"`    | `"r, g, b"`, `"rgb(...)"`, `"#fff"` or `"#ffffff"`                |
| `noiseScale`        | `number`                      | `0.0025`             | Spatial frequency. Lower = bigger, slower blobs                  |
| `speed`             | `number`                      | `0.0008`             | Noise units per ms. `0` = frozen frame                            |
| `backgroundColor`   | `string`                      | `"#121316"`          | Canvas background. `"transparent"` shows the page through         |
| `interactive`       | `boolean`                     | `false`              | React to the pointer                                              |
| `angle`             | `number`                      | `0`                  | Rotates the whole dot grid, in degrees                            |
| `shape`             | `"dot" \| "ring" \| "square"` | `"dot"`              | Geometry of each dot                                              |
| `sizeVariation`     | `number`                      | `0`                  | Noise also drives dot size. `1` = radius between 0x and 2x. Sub-pixel dots are skipped |
| `gamma`             | `number`                      | `2.5`                | Contrast curve. Higher keeps only the peaks                       |
| `intensity`         | `number`                      | `0.7`                | Maximum opacity                                                   |
| `seed`              | `number`                      | `1337`               | Same seed, same pattern                                           |
| `opacityThreshold`  | `number`                      | `0.03`               | Dots below this are not drawn at all                              |
| `pointerRadius`     | `number`                      | `180`                | Influence area in px                                              |
| `pointerStrength`   | `number`                      | `0.9`                | How strongly the pointer affects dots                             |
| `pointerRepel`      | `number`                      | `10`                 | Pixels pushed away from the cursor. Negative pulls them in         |
| `autoPause`         | `boolean`                     | `true`               | Pause on `document.hidden`, resume on return                      |
| `position`          | `"absolute" \| "fixed"`       | `"absolute"`         | CSS position of the canvas                                        |
| `zIndex`            | `number`                      | `0`                  | Use `-1` to sit behind your content                               |
| `preset`            | `string`                      | —                    | Built-in style to start from                                      |

### Methods

| Method                        | Description                                       |
| ----------------------------- | ------------------------------------------------- |
| `init()`                      | Starts the loop. `createDotWave()` calls it for you |
| `updateOptions(options)`      | Applies changes live, no re-creation              |
| `pause()` / `play()`          | Stops / resumes the loop                          |
| `destroy()`                   | Cancels rAF, removes listeners, detaches the canvas |
| `running`                     | Whether the loop is running                       |
| `canvas`                      | The underlying `HTMLCanvasElement`                |

### Angled grids

`angle` turns the whole lattice, not just the dots: the canvas is rotated once
around its centre and the grid is walked over the rotated bounding box, so no
corner is left empty.

```ts
createDotWave({ angle: 45 }); // diagonal grid
createDotWave({ angle: 90 }); // same grid, quarter turn
```

The pointer position is rotated into grid space, so the reaction still lands
exactly under the cursor at any angle.

---

## How it stays at 60fps

Every preset holds 60 fps on a 3840x2160 canvas, measured in Chromium on an
RTX 4060, including `spacing: 12` (which the dot budget stretches) and
`angle: 45`. Same at 1440x900.

The interesting part is what was **removed**. Each of these was measured, not
guessed, and all of them were catastrophic at 4K:

- **No `shadowBlur`.** A blurred shadow rasterised per dot costs ~18 ms per frame
  on a 4K canvas — the whole budget for the glow alone. That is what made the
  first version run at 7 fps on a 4K screen. There is no glow option any more:
  every cheap alternative measured twice the frame time.
- **No canvas-wide paths.** `fill()` on a path that spans the canvas makes the
  browser rasterise the full surface, ~4 ms per fill at 4K. Grouping dots into 24
  opacity buckets that way is ~100 ms per frame. So each dot is its own tiny path:
  ~10 ms for the same grid.
- **No `moveTo()` before `arc()`.** Left over from the bucketed version, it looks
  harmless and measured 9 fps against 59: it stops the path being a plain circle
  the rasteriser can blit.
- **No sub-pixel dots.** A grid of radius-0.9 dots runs at 17 fps; radius 1.0 at
  60. `dotRadius` is clamped to a minimum of 1, and dots that `sizeVariation`
  shrinks below that are skipped — they are the faintest ones of the wave anyway.

And what kept:

- **Noise is vendored.** ~2 KB of seeded 3D Simplex noise, no dependency, and
  `seed` makes the pattern reproducible. Sampling costs ~1.5 ms per frame at 4K,
  so the canvas is where the budget goes.
- **Pre-rendered colours.** The classic implementation builds an `rgba(...)`
  string for every dot on every frame. dotwave pre-renders 24 of them once and
  indexes into them.
- **A dot budget.** Frame time is proportional to dot count, so anything past
  12,000 dots stretches its own `spacing` and warns once, instead of dropping
  frames. That is why `spacing: 12` is not a footgun on a 4K screen.
- **Guards.** Dots below `opacityThreshold` are never drawn.
- **Hidden tab costs nothing.** `document.hidden` pauses the loop, and the time
  step is capped so returning to the tab does not jump.

---

## Frameworks

There is no framework binding on purpose: one `useEffect` covers all of them.

```tsx
// React
import { useEffect, useRef } from "react";
import { createDotWave } from "dotwave";

export function DotWaveBackground() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wave = createDotWave({ container: ref.current, preset: "aurora" });
    return () => wave.destroy(); // cleanup on unmount
  }, []);

  return <div ref={ref} style={{ position: "fixed", inset: 0, zIndex: -1 }} />;
}
```

---

## Development

```bash
pnpm install
pnpm demo        # Vite dev server: playground at /, docs at /docs/
pnpm test        # 48 tests, jsdom canvas mock
pnpm typecheck
pnpm build       # ESM + CJS + minified CDN build + types
pnpm size        # raw / gzip / brotli per file
pnpm demo:build  # static site into site/dist
```

The repository holds the library in `src/` and the site in `site/`: the
playground (`site/index.html`), the documentation (`site/docs/`) and two small
examples. They import `dotwave` through a Vite alias that points at the source,
so everything on the site is the code in this repository, always.

Ideas that are deliberately not built yet live in [docs/IDEAS.md](docs/IDEAS.md).

## Deployment

[dotwave.nachodiaz.es](https://dotwave.nachodiaz.es) is the `site/dist` build of
the Vite site, published to Cloudflare Pages by the
[Deploy](.github/workflows/pages.yml) workflow on every push to `main`.

Cloudflare has to be set up once:

1. Create the project:
   `npx wrangler pages project create dotwave --production-branch main`
2. Add two repository secrets: `CLOUDFLARE_API_TOKEN` (a token with the
   *Cloudflare Pages — Edit* permission) and `CLOUDFLARE_ACCOUNT_ID`.
3. In the Pages dashboard, add the custom domain `dotwave.nachodiaz.es`.

Without the secrets the workflow still installs, typechecks, tests and builds
the site, then skips the upload with a notice, so a fork or a fresh clone is
never red because of deployment.

## License

MIT
