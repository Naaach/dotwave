# dotwave

## 0.1.0

Initial release.

- Animated dotted background driven by vendored, seeded 3D Simplex noise.
- `createDotWave(options)` with 19 live-updatable options.
- Presets: `aurora`, `starfield`, `nebula`, `ember`, `radar`, `minimal`.
- Shapes: `dot`, `ring`, `square`, with noise-driven size variation.
- Pointer reaction: brightness, size and repulsion, with negative values pulling
  dots in instead of pushing them away.
- `angle` rotates the whole dot grid, keeping full corner coverage and rotating
  the pointer position into grid space.
- Performance. Measured in Chromium on an RTX 4060, every preset holds 60 fps on
  a 3840x2160 canvas. Getting there meant dropping three things that looked
  harmless and were not:
  - `shadowBlur`, ~18 ms per 4K frame by itself. No glow option.
  - Canvas-wide `fill()` paths, ~4 ms per fill at 4K; 24 opacity buckets that way
    is ~100 ms per frame. Each dot is its own tiny path instead.
  - `moveTo()` before `arc()`, 9 fps against 59 on a 12k-dot grid.
  Sub-pixel circles are also a trap (radius 0.9 runs at 17 fps, radius 1.0 at
  60), so `dotRadius` has a floor of 1 and `sizeVariation` skips sub-pixel dots.
- A dot budget of 12,000: past that, the spacing stretches and warns once, which
  is why a dense `spacing: 12` is safe on a 4K screen.
- ESM, CJS, minified CDN build and bundled types.
- 48 tests, including a recording canvas mock that asserts what was drawn, plus a
  smoke test that drives the built bundle in jsdom.
