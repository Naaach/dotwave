dotwave paints an animated grid of dots whose opacity, size and position come
from a 3D Simplex noise field sampled once per dot per frame. Zero dependencies,
one canvas, ~5 KB gzipped.

Every knob on the [playground](/) is one of the options on this page.

## Install

### npm / bundler

```bash
npm install dotwave
# or
pnpm add dotwave
```

```ts
import { createDotWave } from "dotwave";

const wave = createDotWave({ container: "#hero", preset: "aurora", angle: 30 });
```

No runtime dependencies and types are included, so no `@types/*` package.

### CDN, plain script tag

```html
<script src="https://unpkg.com/dotwave/dist/index.global.js"></script>
<script>
  DotWave.createDotWave({ preset: "ember" });
</script>
```

The global build exposes `window.DotWave`. ESM works straight from a CDN too:

```html
<script type="module">
  import { createDotWave } from "https://cdn.jsdelivr.net/npm/dotwave@0/+esm";
  createDotWave({ preset: "starfield" });
</script>
```

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

The canvas is injected into the container and never intercepts pointer events,
so everything on top of it stays selectable and clickable. `destroy()` removes
the canvas, the listeners and the animation loop, which is all a single-page
app needs on unmount.

## Options

Everything is optional. Invalid numbers are clamped instead of breaking the
render loop.

| Option             | Type                          | Default           | What it does                                                     |
| ------------------ | ----------------------------- | ----------------- | ---------------------------------------------------------------- |
| `container`        | `HTMLElement \| string`       | `document.body`   | Element or selector that hosts the canvas                         |
| `spacing`          | `number`                      | `22`              | Distance between dots in px                                      |
| `dotRadius`        | `number`                      | `1.2`             | Base radius in px, minimum 1                                     |
| `dotColor`         | `string`                      | `"255, 255, 255"` | `"r, g, b"`, `"rgb(...)"`, `"#fff"` or `"#ffffff"`               |
| `noiseScale`       | `number`                      | `0.0025`          | Spatial frequency. Lower = bigger, slower blobs                  |
| `speed`            | `number`                      | `0.0008`          | Noise units per ms. `0` = frozen frame                           |
| `backgroundColor`  | `string`                      | `"#121316"`       | Canvas background. `"transparent"` shows the page through        |
| `interactive`      | `boolean`                     | `false`           | React to the pointer                                             |
| `angle`            | `number`                      | `0`               | Rotates the whole dot grid, in degrees                           |
| `shape`            | `"dot" \| "ring" \| "square"` | `"dot"`           | Geometry of each dot                                             |
| `sizeVariation`    | `number`                      | `0`               | Noise also drives dot size. `1` = radius between 0x and 2x. Sub-pixel dots are skipped |
| `gamma`            | `number`                      | `2.5`             | Contrast curve. Higher keeps only the peaks                      |
| `intensity`        | `number`                      | `0.7`             | Maximum opacity                                                  |
| `seed`             | `number`                      | `1337`            | Same seed, same pattern                                          |
| `opacityThreshold` | `number`                      | `0.03`            | Dots below this are not drawn at all                             |
| `pointerRadius`    | `number`                      | `180`             | Influence area in px                                             |
| `pointerStrength`  | `number`                      | `0.9`             | How strongly the pointer affects dots                            |
| `pointerRepel`     | `number`                      | `10`              | Pixels pushed away from the cursor. Negative pulls them in       |
| `autoPause`        | `boolean`                     | `true`            | Pause on `document.hidden`, resume on return                     |
| `position`         | `"absolute" \| "fixed"`       | `"absolute"`      | CSS position of the canvas                                       |
| `zIndex`           | `number`                      | `0`               | Use `-1` to sit behind your content                              |
| `preset`           | `string`                      | —                 | Built-in style to start from                                     |

### Methods

| Method                   | Description                                        |
| ------------------------ | -------------------------------------------------- |
| `init()`                 | Starts the loop. `createDotWave()` calls it for you |
| `updateOptions(options)` | Applies changes live, no re-creation               |
| `pause()` / `play()`     | Stops / resumes the loop                           |
| `destroy()`              | Cancels rAF, removes listeners, detaches the canvas |
| `running`                | Whether the loop is running                        |
| `canvas`                 | The underlying `HTMLCanvasElement`                 |

## Presets

Six ready-made looks. Anything you pass alongside `preset` wins over it:
`createDotWave({ preset: "ember", shape: "dot" })` keeps the ember colours with
round dots.

| Preset      | Look                                          |
| ----------- | --------------------------------------------- |
| `aurora`    | Slow mint clouds, reacts to the pointer       |
| `starfield` | Tiny crisp dots twinkling on near-black       |
| `nebula`    | Wide violet haze, very slow                   |
| `ember`     | Warm square embers drifting up                |
| `radar`     | Hollow rings on a grid tilted 15°             |
| `minimal`   | Almost invisible, for readable content on top  |

<div class="preset-switch" id="preset-switch"></div>

<p class="note">
  The buttons repaint the background of this page — the same
  <code>wave.updateOptions({ preset: "aurora" })</code> you would write. Pick
  <code>aurora</code> or <code>nebula</code> and move the pointer over the text.
</p>

```ts
import { createDotWave, presets, presetNames } from "dotwave";

presetNames; // ["aurora", "starfield", "nebula", "ember", "radar", "minimal"]
presets.nebula; // a plain DotWaveOptions object
```

## Shape

`shape` picks the geometry painted on every grid cell: `"dot"` (default),
`"ring"` for a hollow circle, or `"square"` for sharp pixels. The shape only
affects the path, so all three keep the same performance budget.

```ts
createDotWave({ preset: "radar", shape: "square" });
```

## Pointer reaction

With `interactive: true` the dots near the cursor brighten, grow and move. The
area is `pointerRadius` px wide, the effect scales with `pointerStrength`, and
`pointerRepel` is how many pixels dots are pushed away — negative values pull
them in instead.

```ts
createDotWave({ preset: "aurora", pointerRadius: 260, pointerRepel: 14 });
```

The pointer position is rotated into grid space, so the reaction lands exactly
under the cursor at any `angle`.

## Angled grids

`angle` turns the whole lattice, not just the dots: the canvas is rotated once
around its centre and the grid is walked over the rotated bounding box, so no
corner is left empty.

```ts
createDotWave({ angle: 45 }); // diagonal grid
createDotWave({ angle: 90 }); // same grid, quarter turn
```

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

## Performance

Every preset holds 60 fps on a 3840x2160 canvas, measured in Chromium on an
RTX 4060, including `spacing: 12` (which the dot budget stretches) and
`angle: 45`. Same at 1440x900. The interesting part is what was removed — every
one of these was measured, not guessed, and all of them were catastrophic at 4K:

- **No `shadowBlur`.** A blurred shadow rasterised per dot costs ~18 ms per
  frame on a 4K canvas. There is no glow option: every cheap alternative
  measured twice the frame time.
- **No canvas-wide paths.** `fill()` on a path spanning the canvas makes the
  browser rasterise the whole surface, ~4 ms per fill at 4K. Each dot is its own
  tiny path instead.
- **No `moveTo()` before `arc()`.** It looks harmless and measured 9 fps against
  59: it stops the path being a plain circle the rasteriser can blit.
- **No sub-pixel dots.** Radius-0.9 dots run at 17 fps, radius 1.0 at 60.
  `dotRadius` is clamped to a minimum of 1, and `sizeVariation` skips dots it
  shrinks below that.

And what kept: vendored seeded 3D Simplex noise (~2 KB, no dependency), colours
pre-rendered into 24 `rgba()` strings once, a 12,000-dot budget that stretches
`spacing` instead of dropping frames, an `opacityThreshold` guard, and an
`autoPause` that makes a hidden tab cost nothing.

## License

MIT · source, issues and pull requests on [GitHub](https://github.com/Naaach/dotwave) ·
package on [npm](https://www.npmjs.com/package/dotwave).
