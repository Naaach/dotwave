# dotwave

## 0.1.0

Initial release.

- Animated dotted background driven by vendored, seeded 3D Simplex noise.
- `createDotWave(options)` with 22 live-updatable options.
- Presets: `aurora`, `starfield`, `nebula`, `ember`, `radar`, `minimal`.
- Shapes: `dot`, `ring`, `square`, with noise-driven size variation.
- Pointer reaction: brightness, size and repulsion, with negative values pulling
  dots in instead of pushing them away.
- `angle` rotates the whole dot grid, keeping full corner coverage and rotating
  the pointer position into grid space.
- Alpha batching: 24 canvas state changes per frame instead of one per dot, and
  a render loop that allocates nothing.
- ESM, CJS, minified CDN build and bundled types.
- 44 tests, including a recording canvas mock that asserts what was drawn.
