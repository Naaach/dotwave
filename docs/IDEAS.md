# Ideas, not built

Everything here was considered and left out on purpose, so nobody has to dig
through the issues to find out whether it exists. Pull requests welcome.

## Colour

- **Palettes and gradient by noise.** One colour per dot is the current model.
  The obvious next step is mapping the noise value into a 2 or 3 stop gradient,
  with a `palette` option (`["#a78bfa", "#f0abfc"]`) and a `monochrome` escape
  hatch. The batching in `paint()` already groups dots by alpha, so grouping by
  palette stop too is a small change.
- **Multiple layers.** Two or three grids at different `noiseScale`, `speed` and
  `zIndex` values, for parallax depth. Nothing stops calling `createDotWave()`
  twice today; a `layers: [{...}, {...}]` option would just be sugar.

## Performance and accessibility

- **Devicepixelratio.** The canvas is sized in CSS pixels, so on a retina screen
  the dots are softer than a device-pixel-sized backing store would be.
  `dpr: number` (or `dpr: window.devicePixelRatio`) would scale the backing store
  and sharpen them. Cheapest win on the list.
- **Cheaper glow.** ~~One path per dot is what the browser needs to rasterise a
  per-dot shadow, but most of that blur is invisible on dim dots. Skipping the
  shadow on the bottom half of the alpha buckets would cut the cost of the glow
  roughly in half with no visible difference.~~ Measured and removed: the whole
  glow was cut from the library, see Rendering.
- **Adaptive quality.** Measure frame time and raise `spacing` when the frame
  budget is missed, then restore it when there is headroom. Today the budget is a
  fixed 12,000 dots.
- **Reduced motion.** `prefers-reduced-motion: reduce` should ship a still frame
  (or a much slower one) instead of ignoring the user setting.
- **Static mode.** An option that draws exactly one frame and never schedules
  another. Useful for print stylesheets, OG images and screenshots.

## Geometry

- **Connection lines.** Joining nearby dots with faint lines turns the grid into
  a mesh. Much more expensive: a naive pass is O(n²), so it needs a spatial grid,
  and it would likely need its own option.
- **More shapes.** `plus`, `cross`, `diamond`, `line` segments between
  neighbouring cells. The bucket loop in `paint()` would grow a switch.
- **Wave direction.** `angle` rotates the grid, but the noise still evolves in
  place. A `drift` option in noise units per second would make the pattern
  travel across the screen along a direction, like water moving under a grid.

## Rendering

- **Glow, if it can ever be cheap.** The first version had a `glowBlur` option
  built on `shadowBlur`, and it was removed because it measured ~18 ms per frame
  on a 4K canvas — the entire frame budget for the halo alone. Every alternative
  was measured too: a pre-rendered radial sprite drawn per dot, a second wider
  `fill()` pass per dot, a blurred half-resolution layer, all of them cost 2x to
  6x. If a trick shows up that keeps the halo under ~3 ms, the option is worth
  bringing back behind a flag that says "this costs frames".
- **WebGL renderer.** At 40,000+ dots, Canvas2D starts to cost more than the
  noise sampling does. A WebGL2 path drawing points with a shader could push the
  ceiling up a lot, at the cost of a second implementation to keep in sync.
- **OffscreenCanvas.** Hand the loop to a worker so a busy main thread cannot
  stutter it. Needs a fallback anyway.

## API

- **Scroll and input coupling.** `speedFromScroll: number` would speed the waves
  up as the user scrolls. `followPointer` already exists as `interactive`.
- **`onFrame` hook.** A callback per frame for driving other things in sync.
- **Recording.** Export the current frame as a PNG, for social cards and docs.

## Site

- **Pre-rendered docs.** The docs route ships `marked` (~18 KB gzip) and renders
  `content.md` in the browser. A small build-time plugin would render it once,
  drop the dependency, and give every route its own HTML and meta tags — the one
  thing a single-page app loses.
- **Live previews per preset.** The switcher on the docs page repaints the page
  background; six small canvases would show every preset side by side instead.
- **Search.** One page of headings does not need an index yet, but a client-side
  filter over the table of contents would be the first step.
