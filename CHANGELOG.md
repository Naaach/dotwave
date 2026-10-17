# dotwave

## 0.1.0

Initial release.

- Animated dotted background driven by vendored, seeded 3D Simplex noise.
- `createDotWave(options)` with 23 live-updatable options.
- Presets: `aurora`, `starfield`, `nebula`, `ember`, `radar`, `minimal`.
- Shapes: `dot`, `ring`, `square`, with noise-driven size variation.
- Pointer reaction: brightness, size and repulsion, with negative values pulling
  dots in instead of pushing them away.
- `angle` rotates the whole dot grid, keeping full corner coverage and rotating
  the pointer position into grid space.
- Performance: canvas state changes once per alpha bucket instead of per dot, a
  render loop that allocates nothing, and dots drawn one path at a time when a
  glow is on (a single batched path makes the browser rasterise one shadow for
  the whole grid, which is banded and 8x slower).
- Every dot gets its own subpath, so stroked shapes do not get joined by stray
  lines.
- ESM, CJS, minified CDN build and bundled types.
- 49 tests, including a recording canvas mock that asserts what was drawn, plus a
  smoke test that drives the built bundle in jsdom.
