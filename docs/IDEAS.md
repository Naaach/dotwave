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
  the glow is softer than the reference implementation. `dpr: number` (or
  `dpr: window.devicePixelRatio`) would scale the backing store and keep the
  glow crisp. Cheapest win on the list.
- **Cheaper glow.** One path per dot is what the browser needs to rasterise a
  per-dot shadow, but most of that blur is invisible on dim dots. Skipping the
  shadow on the bottom half of the alpha buckets would cut the cost of the glow
  roughly in half with no visible difference.
- **Adaptive quality.** Measure frame time and raise `spacing` or lower
  `glowBlur` when the frame budget is missed, then restore it when there is
  headroom. Today the budget is a fixed 40,000 dots.
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
