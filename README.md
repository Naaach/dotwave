# dotwave

[![npm version](https://img.shields.io/npm/v/dotwave)](https://www.npmjs.com/package/dotwave)
[![CI](https://github.com/Naaach/dotwave/actions/workflows/ci.yml/badge.svg)](https://github.com/Naaach/dotwave/actions/workflows/ci.yml)

> A grid of dots that breathe, driven by 3D Simplex noise.
> Zero dependencies · TypeScript · ESM + CJS + CDN · ~5 KB gzipped.

<p align="center">
  <img src="https://github.com/Naaach/dotwave/raw/main/docs/demo.png" alt="dotwave playground: the aurora preset with live controls, an fps counter and a rotated grid" width="840" />
</p>

Each dot's opacity, size and glow come from a 3D noise field sampled at
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

`run pnpm demo` after `pnpm build` to open the full playground with live
controls, presets and an fps counter.

---

## Presets

Six ready-made looks. Anything you pass alongside `preset` wins over it.

| Preset      | Look                                                  |
| ----------- | ----------------------------------------------------- |
| `aurora`    | Slow mint clouds, big soft glow, reacts to the pointer |
| `starfield` | Tiny crisp dots twinkling on near-black                |
| `nebula`    | Wide violet haze, very soft edges, very slow           |
| `ember`     | Warm square embers drifting up                         |
| `radar`     | Hollow rings on a grid tilted 15°, no glow             |
| `minimal`   | Almost invisible, for readable content on top          |

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
| `dotRadius`         | `number`                      | `1.2`                | Base radius in px                                                 |
| `dotColor`          | `string`                      | `"255, 255, 255"`    | `"r, g, b"`, `"rgb(...)"`, `"#fff"` or `"#ffffff"`                |
| `glowBlur`          | `number`                      | `5`                  | Outer glow (`shadowBlur`) in px                                   |
| `noiseScale`        | `number`                      | `0.0025`             | Spatial frequency. Lower = bigger, slower blobs                  |
| `speed`             | `number`                      | `0.0008`             | Noise units per ms. `0` = frozen frame                            |
| `backgroundColor`   | `string`                      | `"#121316"`          | Canvas background. `"transparent"` shows the page through         |
| `interactive`       | `boolean`                     | `false`              | React to the pointer                                              |
| `angle`             | `number`                      | `0`                  | Rotates the whole dot grid, in degrees                            |
| `shape`             | `"dot" \| "ring" \| "square"` | `"dot"`              | Geometry of each dot                                              |
| `sizeVariation`     | `number`                      | `0`                  | Noise also drives dot size. `1` = radius between 0x and 2x         |
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

Measured at 1440x900 with the presets above: 58 to 60 fps.

- **Noise is vendored.** ~2 KB of seeded 3D Simplex noise, no dependency, and
  `seed` makes the pattern reproducible.
- **No string building per dot.** The classic implementation builds an
  `rgba(...)` string for every dot on every frame, which is thousands of short
  lived strings per second. dotwave pre-renders 24 of them once and indexes into
  them.
- **The canvas state changes per bucket, not per dot.** `fillStyle`,
  `shadowColor` and `shadowBlur` are written once per alpha bucket (24 of them)
  instead of once per dot. That is the expensive part of the loop, and it is now
  bounded by a constant rather than by the size of the grid.
- **One path per dot, but only when there is a glow.** `shadowBlur` is
  rasterised for the whole path at once, so a path holding the entire grid gives
  one giant blurred shadow: banded, and 8x slower than drawing dots one by one.
  With `glowBlur: 0` there is no shadow to rasterise, so the batch is free and
  dots are grouped into a single path.
- **Zero allocations in the loop.** Dots are stored into reused `Float32Array`
  buckets, so the render loop creates nothing for the GC to collect.
- **Guards.** Dots below `opacityThreshold` are never drawn. Grids above 40,000
  dots stretch their own spacing and warn once, instead of locking the tab.
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
pnpm test        # 44 tests, jsdom canvas mock
pnpm typecheck
pnpm build       # ESM + CJS + minified CDN build + types
pnpm size        # raw / gzip / brotli per file
pnpm demo        # static server for examples/
```

Ideas that are deliberately not built yet live in [docs/IDEAS.md](docs/IDEAS.md).

## License

MIT
